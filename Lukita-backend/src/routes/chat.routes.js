import { Router } from 'express'
import { z } from 'zod'
import { env, groqConfigured, azureSpeechConfigured } from '../config/env.js'
import { groq, mapearErrorGroq } from '../lib/groq.js'
import { sintetizarVoz } from '../lib/azureSpeech.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../utils/httpError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOwnedPerfil } from '../lib/ownership.js'

export const chatRouter = Router({ mergeParams: true })

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

// [inicio, fin) de un mes "YYYY-MM".
function rangoMes(mes) {
  const inicio = new Date(`${mes}-01T00:00:00.000Z`)
  const fin = new Date(inicio)
  fin.setUTCMonth(fin.getUTCMonth() + 1)
  return { inicio, fin }
}

// ---------------------------------------------------------------------------
// Herramientas fijas: el LLM nunca toca Prisma ni SQL directamente, solo
// puede pedir una de estas 4 funciones con argumentos ya validados.
// ---------------------------------------------------------------------------
async function gastoPorCategoria(perfilId, mes) {
  const { inicio, fin } = rangoMes(mes)
  const filas = await prisma.transaccion.groupBy({
    by: ['categoriaId'],
    where: { perfilId, tipo: 'gasto', fecha: { gte: inicio, lt: fin } },
    _sum: { monto: true },
  })
  if (!filas.length) return { mes, categorias: [] }

  const categorias = await prisma.categoria.findMany({
    where: { id: { in: filas.map((f) => f.categoriaId) } },
  })
  const nombrePorId = new Map(categorias.map((c) => [c.id, c.nombre]))

  return {
    mes,
    categorias: filas
      .map((f) => ({ categoria: nombrePorId.get(f.categoriaId) ?? '?', total: Number(f._sum.monto ?? 0) }))
      .sort((a, b) => b.total - a.total),
  }
}

async function totalesDelMes(perfilId, mes) {
  const { inicio, fin } = rangoMes(mes)
  const filas = await prisma.transaccion.groupBy({
    by: ['tipo'],
    where: { perfilId, fecha: { gte: inicio, lt: fin } },
    _sum: { monto: true },
  })
  const totales = { ingreso: 0, gasto: 0 }
  filas.forEach((f) => {
    totales[f.tipo] = Number(f._sum.monto ?? 0)
  })
  return totales
}

async function compararMeses(perfilId, mesA, mesB) {
  const [totalesA, totalesB] = await Promise.all([
    totalesDelMes(perfilId, mesA),
    totalesDelMes(perfilId, mesB),
  ])
  return { [mesA]: totalesA, [mesB]: totalesB }
}

async function presupuestoRestante(perfilId, nombreCategoria, mes) {
  const categoria = await prisma.categoria.findFirst({
    where: { perfilId, tipo: 'gasto', nombre: { equals: nombreCategoria, mode: 'insensitive' } },
  })
  if (!categoria) return { error: `No encontre una categoria de gasto llamada "${nombreCategoria}"` }

  const mesInicio = new Date(`${mes}-01T00:00:00.000Z`)
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { perfilId_categoriaId_mes: { perfilId, categoriaId: categoria.id, mes: mesInicio } },
  })
  if (!presupuesto) {
    return { categoria: categoria.nombre, mes, mensaje: 'No hay un presupuesto definido para esa categoria ese mes' }
  }

  const { fin } = rangoMes(mes)
  const gastado = await prisma.transaccion.aggregate({
    where: { perfilId, categoriaId: categoria.id, tipo: 'gasto', fecha: { gte: mesInicio, lt: fin } },
    _sum: { monto: true },
  })
  const limite = Number(presupuesto.montoLimite)
  const total = Number(gastado._sum.monto ?? 0)
  return { categoria: categoria.nombre, mes, limite, gastado: total, restante: limite - total }
}

async function topGastos(perfilId, mes, n) {
  const { inicio, fin } = rangoMes(mes)
  const filas = await prisma.transaccion.findMany({
    where: { perfilId, tipo: 'gasto', fecha: { gte: inicio, lt: fin } },
    orderBy: { monto: 'desc' },
    take: Math.min(Math.max(Number(n) || 5, 1), 10),
    include: { categoria: true },
  })
  return filas.map((f) => ({
    descripcion: f.descripcion ?? f.categoria.nombre,
    categoria: f.categoria.nombre,
    monto: Number(f.monto),
    fecha: f.fecha.toISOString().slice(0, 10),
  }))
}

async function ejecutarHerramienta(perfilId, nombre, args) {
  switch (nombre) {
    case 'gasto_por_categoria':
      return gastoPorCategoria(perfilId, args.mes)
    case 'comparar_meses':
      return compararMeses(perfilId, args.mesA, args.mesB)
    case 'presupuesto_restante':
      return presupuestoRestante(perfilId, args.categoria, args.mes)
    case 'top_gastos':
      return topGastos(perfilId, args.mes, args.n)
    default:
      return { error: `Herramienta desconocida: ${nombre}` }
  }
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'gasto_por_categoria',
      description: 'Suma los gastos del perfil, agrupados por categoria, en un mes dado.',
      parameters: {
        type: 'object',
        properties: { mes: { type: 'string', description: 'Mes en formato YYYY-MM' } },
        required: ['mes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'comparar_meses',
      description: 'Compara el total de ingresos y gastos entre dos meses.',
      parameters: {
        type: 'object',
        properties: {
          mesA: { type: 'string', description: 'Primer mes en formato YYYY-MM' },
          mesB: { type: 'string', description: 'Segundo mes en formato YYYY-MM' },
        },
        required: ['mesA', 'mesB'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'presupuesto_restante',
      description: 'Da el presupuesto, lo gastado y lo restante de una categoria de gasto en un mes.',
      parameters: {
        type: 'object',
        properties: {
          categoria: { type: 'string', description: 'Nombre de la categoria de gasto' },
          mes: { type: 'string', description: 'Mes en formato YYYY-MM' },
        },
        required: ['categoria', 'mes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'top_gastos',
      description: 'Los gastos mas grandes de un mes, de mayor a menor.',
      parameters: {
        type: 'object',
        properties: {
          mes: { type: 'string', description: 'Mes en formato YYYY-MM' },
          n: { type: 'number', description: 'Cuantos mostrar, por defecto 5' },
        },
        required: ['mes'],
      },
    },
  },
]

function systemPrompt() {
  return `Eres Lukita, un asistente financiero personal para usuarios en Perú. Respondes en español, breve y conversacional (2-3 frases) porque tu respuesta se lee en voz alta y tambien se muestra como texto plano: no uses markdown, asteriscos, negritas, ni viñetas de ningun tipo. Todos los montos son en soles peruanos; escribelos como "S/ 450", nunca con el símbolo de euros o dólares. Usa siempre las herramientas disponibles para obtener datos reales del usuario; nunca inventes montos ni categorias. Si una herramienta no encuentra datos, dilo con naturalidad. Hoy es ${hoyISO()}; "este mes" es ese mes y "el mes pasado" es el anterior.`
}

async function responder(perfilId, pregunta) {
  const mensajes = [
    { role: 'system', content: systemPrompt() },
    { role: 'user', content: pregunta },
  ]

  for (let vuelta = 0; vuelta < 4; vuelta++) {
    let completion
    try {
      completion = await groq.chat.completions.create({
        model: env.groq.llmModel,
        messages: mensajes,
        tools: TOOLS,
      })
    } catch (error) {
      throw mapearErrorGroq(error, 'No se pudo responder la pregunta')
    }

    const mensaje = completion.choices[0].message
    mensajes.push(mensaje)

    if (!mensaje.tool_calls?.length) {
      return mensaje.content?.trim() || 'No tengo una respuesta para eso.'
    }

    for (const llamada of mensaje.tool_calls) {
      let args = {}
      try {
        args = JSON.parse(llamada.function.arguments || '{}')
      } catch {
        // deja args vacio; la herramienta decide que hacer con eso.
      }
      const resultado = await ejecutarHerramienta(perfilId, llamada.function.name, args)
      mensajes.push({ role: 'tool', tool_call_id: llamada.id, content: JSON.stringify(resultado) })
    }
  }

  throw new HttpError(502, 'No se pudo responder la pregunta; intenta reformularla')
}

const preguntaSchema = z.object({ pregunta: z.string().trim().min(1).max(300) })
const textoSchema = z.object({ texto: z.string().trim().min(1).max(600) })

chatRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)
    const { pregunta } = preguntaSchema.parse(req.body)

    if (!groqConfigured) {
      return res.json({
        respuesta:
          '(modo de prueba) Este mes gastaste más en Alimentación, con S/ 450. Comparado con el mes pasado, gastaste un poco menos.',
      })
    }

    const respuesta = await responder(perfilId, pregunta)
    res.json({ respuesta })
  }),
)

chatRouter.post(
  '/hablar',
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)
    const { texto } = textoSchema.parse(req.body)

    if (!azureSpeechConfigured) {
      throw new HttpError(503, 'El texto a voz no esta configurado; usa la voz del navegador')
    }

    const audio = await sintetizarVoz(texto)
    res.set('Content-Type', 'audio/mpeg')
    res.send(audio)
  }),
)

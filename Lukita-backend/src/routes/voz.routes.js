import { Router } from 'express'
import multer from 'multer'
import { toFile } from 'openai'
import { z } from 'zod'
import { env, groqConfigured } from '../config/env.js'
import { groq, mapearErrorGroq } from '../lib/groq.js'
import { HttpError } from '../utils/httpError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOwnedPerfil } from '../lib/ownership.js'
import { categoriasDeGasto } from '../lib/categorias.js'

export const vozRouter = Router({ mergeParams: true })

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // clip de voz corto; de sobra
})

const interpretacionSchema = z.object({
  monto: z.number().positive().nullable(),
  descripcion: z.string().trim().max(200).nullable(),
  categoriaId: z.string().nullable(),
  fecha: z.string().nullable(),
  // El LLM a veces manda null explicito (no "ausente"), con lo que
  // .default() no alcanza a cubrirlo -- de ahi el .nullable().transform().
  tipo: z
    .enum(['ingreso', 'gasto'])
    .nullable()
    .optional()
    .transform((valor) => valor ?? 'gasto'),
})

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function resultadoDePrueba() {
  return {
    transcripcion: '(modo de prueba) Gasté 25 soles en pollo a la brasa en Norky\'s',
    legible: true,
    monto: 25,
    descripcion: "Pollo a la brasa en Norky's",
    categoriaId: null,
    fecha: hoyISO(),
    tipo: 'gasto',
  }
}

async function transcribir(buffer) {
  try {
    const respuesta = await groq.audio.transcriptions.create({
      file: await toFile(buffer, 'audio.webm'),
      model: env.groq.whisperModel,
      language: 'es',
    })
    return respuesta.text?.trim() ?? ''
  } catch (error) {
    throw mapearErrorGroq(error, 'No se pudo transcribir el audio')
  }
}

// Le pasamos al modelo las categorias reales del perfil para que intente
// calzar una; si no calza ninguna, el frontend deja elegir a mano.
async function interpretar(texto, categorias) {
  const prompt = `Interpreta este registro de gasto o ingreso hablado por un usuario peruano y responde SOLO un JSON con esta forma exacta:
{"monto": numero positivo o null, "descripcion": texto corto o null, "categoriaId": uno de los ids de la lista o null, "fecha": "YYYY-MM-DD" o null, "tipo": "gasto" o "ingreso"}

Hoy es ${hoyISO()}. Si el usuario no menciona fecha, usa hoy. Si menciona "ayer", "antier" u otra referencia relativa, calculala a partir de hoy.
Categorias disponibles (usa el id solo si el texto calza claramente con el nombre, si no usa null):
${JSON.stringify(categorias)}

Texto transcrito: "${texto}"`

  let completion
  try {
    completion = await groq.chat.completions.create({
      model: env.groq.llmModel,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (error) {
    throw mapearErrorGroq(error, 'No se pudo interpretar el audio')
  }

  let datos
  try {
    datos = JSON.parse(completion.choices[0].message.content)
  } catch {
    throw new HttpError(502, 'No se pudo interpretar el audio; intenta de nuevo')
  }

  const parseo = interpretacionSchema.safeParse(datos)
  if (!parseo.success) throw new HttpError(502, 'No se pudo interpretar el audio; intenta de nuevo')

  const idsValidos = new Set(categorias.map((c) => c.id))
  const resultado = parseo.data
  return {
    ...resultado,
    categoriaId: idsValidos.has(resultado.categoriaId) ? resultado.categoriaId : null,
    fecha: resultado.fecha && !Number.isNaN(Date.parse(resultado.fecha)) ? resultado.fecha : hoyISO(),
  }
}

vozRouter.post(
  '/',
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)

    if (!req.file) throw new HttpError(400, 'Falta el archivo "audio"')

    if (!groqConfigured) {
      return res.json(resultadoDePrueba())
    }

    const categorias = await categoriasDeGasto(perfilId)
    const texto = await transcribir(req.file.buffer)
    if (!texto) throw new HttpError(400, 'No se entendio el audio; intenta hablar mas claro')

    const interpretacion = await interpretar(texto, categorias)
    res.json({ transcripcion: texto, legible: true, ...interpretacion })
  }),
)

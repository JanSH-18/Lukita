import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { env, visionAulaConfigured } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOwnedPerfil } from '../lib/ownership.js'
import { categoriasDeGasto } from '../lib/categorias.js'

export const recibosRouter = Router({ mergeParams: true })

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB: la foto cruda del celular, antes de reducirla
})

// vision-aula exige <=2048px por lado y <=2MB. Reducimos a 1600px (el
// propio instructivo dice que a esa medida lee igual de bien) y bajamos
// la calidad JPEG si por alguna razon sigue pesando de mas.
async function reducirParaVisionAula(buffer) {
  let calidad = 85
  for (let intento = 0; intento < 4; intento++) {
    const salida = await sharp(buffer)
      .rotate() // respeta la orientacion EXIF de fotos de celular
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: calidad })
      .toBuffer()
    if (salida.byteLength <= 2 * 1024 * 1024) return salida
    calidad -= 20
  }
  throw new HttpError(413, 'La foto es demasiado pesada incluso reducida; intenta con otra foto')
}

function resultadoDePrueba() {
  return {
    legible: true,
    fuente: 'mock',
    comercio: 'Supermercado (dato de prueba)',
    ruc: null,
    fecha: new Date().toISOString().slice(0, 10),
    moneda: 'PEN',
    total: 23.9,
    medioPago: 'desconocido',
    lineas: [{ descripcion: 'Producto de prueba', cantidad: 1, importe: 23.9, categoriaId: null }],
    camposDudosos: [],
  }
}

// Mapea la respuesta real de vision-aula (ver INSTRUCTIVO.md del repo
// vision-aula) a la forma que usa el resto de esta API (camelCase,
// nombres alineados con el modelo Transaccion de Prisma).
function mapearRespuesta(datos) {
  if (!datos.legible) return { legible: false }
  return {
    legible: true,
    comercio: datos.comercio ?? null,
    ruc: datos.ruc ?? null,
    fecha: datos.fecha ?? null,
    moneda: datos.moneda ?? 'PEN',
    total: typeof datos.total === 'number' ? datos.total : null,
    medioPago: datos.medio_pago ?? 'desconocido',
    lineas: Array.isArray(datos.lineas)
      ? datos.lineas.map((l) => ({
          descripcion: l.descripcion ?? null,
          cantidad: l.cantidad ?? null,
          importe: typeof l.importe_final === 'number' ? l.importe_final : null,
          categoriaId: l.categoria ?? null,
        }))
      : [],
    camposDudosos: Array.isArray(datos.campos_dudosos) ? datos.campos_dudosos : [],
  }
}

async function leerBoleta(imagenBuffer, categorias) {
  let respuesta
  try {
    respuesta = await fetch(env.visionAula.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.visionAula.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagen: imagenBuffer.toString('base64'), categorias }),
    })
  } catch {
    throw new HttpError(502, 'No se pudo contactar al servicio de lectura de boletas')
  }

  const cuerpo = await respuesta.json().catch(() => null)

  if (respuesta.ok) return mapearRespuesta(cuerpo.datos)

  // 401 aqui es un problema nuestro (token mal configurado), no del
  // usuario final -- no se lo mostramos como si fuera su culpa.
  if (respuesta.status === 401) throw new HttpError(502, 'El servicio de lectura de boletas no esta disponible ahora mismo')
  if (respuesta.status === 403 && cuerpo?.error === 'presupuesto_agotado') {
    console.error('vision-aula agoto su presupuesto total; el servicio dejo de responder para siempre')
    throw new HttpError(503, 'El servicio de lectura de boletas ya no esta disponible')
  }
  if (respuesta.status === 429) throw new HttpError(429, 'El servicio esta ocupado o alcanzo su limite por ahora; intenta de nuevo en unos minutos')
  if (respuesta.status === 413) throw new HttpError(413, 'La foto es demasiado pesada')
  if (respuesta.status === 400) throw new HttpError(400, cuerpo?.error ?? 'La imagen no pudo procesarse')
  throw new HttpError(502, 'Fallo la lectura de la boleta; intenta de nuevo')
}

recibosRouter.post(
  '/analizar',
  upload.single('foto'),
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)

    if (!req.file) throw new HttpError(400, 'Falta el archivo "foto"')

    if (!visionAulaConfigured) {
      return res.json(resultadoDePrueba())
    }

    const [imagenReducida, categorias] = await Promise.all([
      reducirParaVisionAula(req.file.buffer),
      categoriasDeGasto(perfilId),
    ])
    const resultado = await leerBoleta(imagenReducida, categorias)
    res.json(resultado)
  }),
)

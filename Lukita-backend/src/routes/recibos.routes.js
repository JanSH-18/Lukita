import { Router } from 'express'
import multer from 'multer'
import { foundryConfigured } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const recibosRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB: suficiente para una foto de boleta
})

// Hito 2 de la bitacora: aqui va la llamada real a un modelo de vision en
// Azure AI Foundry (lee la foto y devuelve monto/comercio/categoria en un
// JSON con esta misma forma). Mientras no haya credenciales en .env,
// devolvemos un resultado de prueba para que el frontend ya pueda
// integrarse contra este contrato.
async function analizarConFoundry(imagenBuffer) {
  throw new HttpError(501, 'Azure AI Foundry todavia no esta configurado (ver .env.example)')
}

function resultadoDePrueba() {
  return {
    fuente: 'mock',
    montoSugerido: 23.9,
    comercioSugerido: 'Supermercado (dato de prueba)',
    categoriaSugerida: 'Alimentación',
    fechaSugerida: new Date().toISOString().slice(0, 10),
    confianza: 0.0,
  }
}

recibosRouter.post(
  '/analizar',
  upload.single('foto'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Falta el archivo "foto"')

    if (!foundryConfigured) {
      return res.json(resultadoDePrueba())
    }

    const resultado = await analizarConFoundry(req.file.buffer)
    res.json(resultado)
  }),
)

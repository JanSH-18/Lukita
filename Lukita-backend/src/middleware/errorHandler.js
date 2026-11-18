import { HttpError } from '../utils/httpError.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }

  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Datos invalidos', detalles: err.issues })
  }

  console.error(err)
  return res.status(500).json({ error: 'Error interno del servidor' })
}

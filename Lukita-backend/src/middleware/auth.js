import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

// Lee el "Authorization: Bearer <token>", lo valida y deja el id del
// usuario en req.usuarioId para que las rutas protegidas lo usen.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Falta el token de autenticacion'))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.usuarioId = BigInt(payload.sub)
    next()
  } catch {
    next(new HttpError(401, 'Token invalido o vencido'))
  }
}

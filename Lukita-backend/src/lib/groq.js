import OpenAI, { APIError } from 'openai'
import { env, groqConfigured } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

// Groq expone una API compatible con el SDK de OpenAI; solo cambia la baseURL.
export const groq = groqConfigured
  ? new OpenAI({ apiKey: env.groq.apiKey, baseURL: 'https://api.groq.com/openai/v1' })
  : null

// 401/403 aqui son un problema nuestro (API key mal configurada), no del
// usuario final. Lo usan voz.routes.js y chat.routes.js.
export function mapearErrorGroq(error, mensajePorDefecto) {
  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403) {
      return new HttpError(502, 'El asistente no esta disponible ahora mismo')
    }
    if (error.status === 429) {
      return new HttpError(
        429,
        'El asistente esta ocupado o alcanzo su limite por ahora; intenta de nuevo en unos minutos',
      )
    }
    if (error.status === 413) return new HttpError(413, 'El archivo es demasiado pesado')
  }
  return new HttpError(502, mensajePorDefecto)
}

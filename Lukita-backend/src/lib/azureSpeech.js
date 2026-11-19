import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

// Los tokens de Azure Speech duran 10 minutos; los cacheamos 9 para no
// pedir uno nuevo en cada respuesta.
let tokenCache = { valor: null, expiraEn: 0 }

async function obtenerToken() {
  if (tokenCache.valor && Date.now() < tokenCache.expiraEn) return tokenCache.valor

  let respuesta
  try {
    respuesta = await fetch(
      `https://${env.azureSpeech.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': env.azureSpeech.key } },
    )
  } catch {
    throw new HttpError(502, 'No se pudo contactar al servicio de voz')
  }
  if (!respuesta.ok) throw new HttpError(502, 'El servicio de voz no esta disponible ahora mismo')

  const token = await respuesta.text()
  tokenCache = { valor: token, expiraEn: Date.now() + 9 * 60 * 1000 }
  return token
}

function escaparSsml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Devuelve el audio (mp3) de `texto` leido con la voz configurada.
export async function sintetizarVoz(texto) {
  const token = await obtenerToken()
  const ssml = `<speak version='1.0' xml:lang='es-PE'><voice name='${env.azureSpeech.voice}'>${escaparSsml(texto)}</voice></speak>`

  let respuesta
  try {
    respuesta = await fetch(
      `https://${env.azureSpeech.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3',
        },
        body: ssml,
      },
    )
  } catch {
    throw new HttpError(502, 'No se pudo contactar al servicio de voz')
  }
  if (!respuesta.ok) throw new HttpError(502, 'No se pudo generar el audio de la respuesta')

  return Buffer.from(await respuesta.arrayBuffer())
}

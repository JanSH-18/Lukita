import 'dotenv/config'

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name} (revisa .env.example).`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  visionAula: {
    url: process.env.VISION_AULA_URL || 'https://boletas-aula.analizodatos.com/v1/boleta',
    token: process.env.VISION_AULA_TOKEN ?? '',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? '',
    whisperModel: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
    llmModel: process.env.GROQ_LLM_MODEL || 'openai/gpt-oss-120b',
  },
  azureSpeech: {
    key: process.env.AZURE_SPEECH_KEY ?? '',
    region: process.env.AZURE_SPEECH_REGION ?? '',
    voice: process.env.AZURE_SPEECH_VOICE || 'es-PE-CamilaNeural',
  },
}

export const visionAulaConfigured = Boolean(env.visionAula.token)
export const groqConfigured = Boolean(env.groq.apiKey)
export const azureSpeechConfigured = Boolean(env.azureSpeech.key && env.azureSpeech.region)

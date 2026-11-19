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
}

export const visionAulaConfigured = Boolean(env.visionAula.token)

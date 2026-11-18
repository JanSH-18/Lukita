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
  azureFoundry: {
    endpoint: process.env.AZURE_FOUNDRY_ENDPOINT ?? '',
    apiKey: process.env.AZURE_FOUNDRY_API_KEY ?? '',
    deployment: process.env.AZURE_FOUNDRY_DEPLOYMENT ?? '',
  },
}

export const foundryConfigured = Boolean(
  env.azureFoundry.endpoint && env.azureFoundry.apiKey && env.azureFoundry.deployment,
)

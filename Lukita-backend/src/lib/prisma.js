import { PrismaClient } from '@prisma/client'

// Una sola instancia compartida por todo el proceso.
export const prisma = new PrismaClient()

import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOwnedPerfil } from '../lib/ownership.js'

export const cuentasRouter = Router({ mergeParams: true })

const crearCuentaSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  tipo: z.enum(['efectivo', 'banco', 'tarjeta']),
  saldoInicial: z.number().finite().default(0),
})

cuentasRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)

    const cuentas = await prisma.cuenta.findMany({
      where: { perfilId },
      orderBy: { creadoEn: 'asc' },
    })
    res.json(cuentas)
  }),
)

cuentasRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)

    const { nombre, tipo, saldoInicial } = crearCuentaSchema.parse(req.body)
    const cuenta = await prisma.cuenta.create({
      data: { perfilId, nombre, tipo, saldoInicial },
    })
    res.status(201).json(cuenta)
  }),
)

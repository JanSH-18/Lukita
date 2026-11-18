import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOwnedPerfil } from '../lib/ownership.js'

export const categoriasRouter = Router({ mergeParams: true })

const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  tipo: z.enum(['ingreso', 'gasto']),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un hex de 6 digitos, ej. #10B981')
    .optional(),
})

categoriasRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)

    const categorias = await prisma.categoria.findMany({
      where: { perfilId },
      orderBy: { nombre: 'asc' },
    })
    res.json(categorias)
  }),
)

categoriasRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const perfilId = BigInt(req.params.perfilId)
    await getOwnedPerfil(perfilId, req.usuarioId)

    const { nombre, tipo, color } = crearCategoriaSchema.parse(req.body)
    const categoria = await prisma.categoria.create({
      data: { perfilId, nombre, tipo, color },
    })
    res.status(201).json(categoria)
  }),
)

import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const perfilesRouter = Router()

const crearPerfilSchema = z.object({
  tipo: z.enum(['personal', 'empresarial']),
  nombre: z.string().trim().max(120).optional(),
})

perfilesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const perfiles = await prisma.perfil.findMany({
      where: { usuarioId: req.usuarioId },
      orderBy: { creadoEn: 'asc' },
    })
    res.json(perfiles)
  }),
)

perfilesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { tipo, nombre } = crearPerfilSchema.parse(req.body)

    const existente = await prisma.perfil.findUnique({
      where: { usuarioId_tipo: { usuarioId: req.usuarioId, tipo } },
    })
    if (existente) throw new HttpError(409, `Ya tienes un perfil ${tipo}`)

    const perfil = await prisma.perfil.create({
      data: { usuarioId: req.usuarioId, tipo, nombre },
    })
    res.status(201).json(perfil)
  }),
)

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

export const authRouter = Router()

const registroSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

function signToken(usuario) {
  return jwt.sign({ sub: usuario.id.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

function toPublicUsuario(usuario) {
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
}

// El indice unico real es sobre lower(email); normalizamos aqui para
// que login/registro se comporten igual que esa restriccion de la BD.
const normalizeEmail = (email) => email.toLowerCase()

authRouter.post(
  '/registro',
  asyncHandler(async (req, res) => {
    const { nombre, email, password } = registroSchema.parse(req.body)
    const emailNormalizado = normalizeEmail(email)

    const existente = await prisma.usuario.findUnique({ where: { email: emailNormalizado } })
    if (existente) throw new HttpError(409, 'Ya existe una cuenta con ese correo')

    const passwordHash = await bcrypt.hash(password, 12)

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email: emailNormalizado,
        password: passwordHash,
        perfiles: {
          create: { tipo: 'personal', nombre: 'Personal' },
        },
      },
    })

    res.status(201).json({ token: signToken(usuario), usuario: toPublicUsuario(usuario) })
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body)

    const usuario = await prisma.usuario.findUnique({ where: { email: normalizeEmail(email) } })
    const credencialesValidas = usuario && (await bcrypt.compare(password, usuario.password))

    if (!credencialesValidas) throw new HttpError(401, 'Correo o contraseña incorrectos')

    res.json({ token: signToken(usuario), usuario: toPublicUsuario(usuario) })
  }),
)

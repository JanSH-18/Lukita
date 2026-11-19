import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'
import { isValidRuc } from '../lib/ruc.js'

export const authRouter = Router()

// Mismos nombres de campo que Lukita-fronted/src/lib/auth.js (registerUser),
// para que reemplazar esa funcion por un fetch a esta API sea un cambio chico.
const registroSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(120),
    password: z.string().min(8).max(72),
    usageType: z.enum(['personal', 'empresarial']),
    ruc: z.string().trim().optional(),
  })
  .refine((data) => data.usageType !== 'empresarial' || isValidRuc(data.ruc), {
    message: 'El RUC no es valido para un perfil empresarial',
    path: ['ruc'],
  })

// Hash de relleno: compara igual aunque el correo no exista, para que el
// tiempo de respuesta no delate si una cuenta esta registrada (misma idea
// que el DUMMY_HASH de auth.js en el frontend).
const DUMMY_HASH = '$2b$12$uR4PK791KBvSbJRHGXgbh.iIT9jssJxN4xntvyzt4c2yvI86z4j/a'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

function signToken(usuario) {
  return jwt.sign({ sub: usuario.id.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

function toPublicUsuario(usuario) {
  return { id: usuario.id, name: usuario.nombre, email: usuario.email }
}

// El indice unico real es sobre lower(email); normalizamos aqui para
// que login/registro se comporten igual que esa restriccion de la BD.
const normalizeEmail = (email) => email.toLowerCase()

authRouter.post(
  '/registro',
  asyncHandler(async (req, res) => {
    const { name, email, password, usageType, ruc } = registroSchema.parse(req.body)
    const emailNormalizado = normalizeEmail(email)

    const existente = await prisma.usuario.findUnique({ where: { email: emailNormalizado } })
    if (existente) throw new HttpError(409, 'Ya existe una cuenta con ese correo')

    const passwordHash = await bcrypt.hash(password, 12)
    const esEmpresarial = usageType === 'empresarial'

    const usuario = await prisma.usuario.create({
      data: {
        nombre: name,
        email: emailNormalizado,
        password: passwordHash,
        perfiles: {
          // Sin esto el perfil nace sin cuentas ni categorias, y ni
          // /recibos/analizar ni /voz tendrian con que trabajar.
          create: {
            tipo: usageType,
            nombre: esEmpresarial ? null : 'Personal',
            ruc: esEmpresarial ? ruc : null,
            cuentas: {
              create: [{ nombre: 'Efectivo', tipo: 'efectivo', saldoInicial: 0 }],
            },
            categorias: {
              create: [
                { nombre: 'Alimentación', tipo: 'gasto' },
                { nombre: 'Transporte', tipo: 'gasto' },
                { nombre: 'Ocio', tipo: 'gasto' },
                { nombre: 'Vivienda', tipo: 'gasto' },
                { nombre: 'Salud', tipo: 'gasto' },
                { nombre: 'Sueldo', tipo: 'ingreso' },
              ],
            },
          },
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
    const coincide = await bcrypt.compare(password, usuario?.password ?? DUMMY_HASH)

    if (!usuario || !coincide) throw new HttpError(401, 'Correo o contraseña incorrectos')

    res.json({ token: signToken(usuario), usuario: toPublicUsuario(usuario) })
  }),
)

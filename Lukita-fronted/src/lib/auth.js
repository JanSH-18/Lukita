// Autenticacion real: registerUser/authenticate llaman al backend
// (Node/Express/Prisma en Lukita-backend) y el token lo firma el servidor.
// getUserRuc/updateUserRuc siguen siendo locales (ver nota mas abajo).
import { apiFetch, ApiError } from './api'
import { isValidRuc } from './ruc'

// ---------------------------------------------------------------------------
// Constantes y validaciones
// ---------------------------------------------------------------------------
const USERS_KEY = 'lukita_users'
const TOKEN_KEY = 'lukita_token'

export const MIN_PASSWORD_LENGTH = 8
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'yopmail.com',
])

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()

export function isDisposableEmail(email) {
  return DISPOSABLE_EMAIL_DOMAINS.has(normalizeEmail(email).split('@').at(-1))
}

// ---------------------------------------------------------------------------
// Lista local de usuarios: ya no la llena registerUser (el backend es la
// fuente real). Solo queda para getUserRuc/updateUserRuc (edicion de RUC en
// Configuracion), que todavia no tiene un endpoint propio en el backend;
// por lo tanto nunca va a encontrar al usuario real y se queda inerte.
// isEmailRegistered por la misma razon ya no se usa para la validacion en
// vivo del registro (ver authValidation.js): el backend devuelve 409 si el
// correo ya existe.
// ---------------------------------------------------------------------------
function getRegisteredUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
    return Array.isArray(users) ? users : []
  } catch {
    return []
  }
}

function findUser(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  return (
    getRegisteredUsers().find((user) => normalizeEmail(user?.email) === normalized) ??
    null
  )
}

export function isEmailRegistered(email) {
  return Boolean(findUser(email))
}

export async function registerUser({ name, email, password, usageType, ruc = '' }) {
  // El RUC solo se pide (y se guarda) para el perfil empresarial.
  const isBusiness = usageType === 'empresarial'
  if (isBusiness && !isValidRuc(ruc)) throw new Error('INVALID_RUC')

  try {
    return await apiFetch('/api/auth/registro', {
      method: 'POST',
      body: {
        name: String(name).trim(),
        email: normalizeEmail(email),
        password,
        usageType,
        ruc: isBusiness ? ruc : undefined,
      },
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) throw new Error('EMAIL_TAKEN', { cause: error })
    throw error
  }
}

// RUC guardado del usuario ('' si no tiene).
export function getUserRuc(email) {
  return findUser(email)?.ruc ?? ''
}

// Guarda o borra ('') el RUC de un usuario ya registrado.
export function updateUserRuc(email, ruc) {
  if (ruc && !isValidRuc(ruc)) throw new Error('INVALID_RUC')
  const normalized = normalizeEmail(email)
  const users = getRegisteredUsers().map((user) =>
    normalizeEmail(user?.email) === normalized ? { ...user, ruc } : user,
  )
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Devuelve { token, id, name, email } si las credenciales son correctas; si no, null.
export async function authenticate(email, password) {
  try {
    const { token, usuario } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email: normalizeEmail(email), password },
    })
    return { token, id: usuario.id, name: usuario.name, email: usuario.email }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

// ---------------------------------------------------------------------------
// Sesion: el token real lo firma el backend; aqui solo se guarda junto con
// los datos publicos del usuario que devuelve login/registro.
// ---------------------------------------------------------------------------
const readRaw = () =>
  sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

// Devuelve { token, id, name, email } o null si no hay sesion valida.
export function getSession() {
  const raw = readRaw()
  if (!raw) return null

  try {
    const { token, usuario } = JSON.parse(raw)
    if (!token || !usuario) {
      clearSession()
      return null
    }
    return { token, id: usuario.id, name: usuario.name, email: usuario.email }
  } catch {
    clearSession()
    return null
  }
}

// "Recordarme" guarda la sesion en localStorage; si no, solo en sessionStorage
// (se pierde al cerrar la pestaña). El token en si ya trae su propia
// expiracion (la fija JWT_EXPIRES_IN en el backend).
export function createSession(user, remember) {
  clearSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      token: user.token,
      usuario: { id: user.id, name: user.name, email: user.email },
    }),
  )
  return user.token
}

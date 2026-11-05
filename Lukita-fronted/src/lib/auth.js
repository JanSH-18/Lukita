// Autenticacion de demostracion: usuarios y sesion se guardan en el navegador.
// Cuando exista el backend en Node.js, este archivo sera el unico que cambie:
// registerUser/authenticate pasaran a llamar a la API y el token lo firmara el servidor.
import { compare, hash } from 'bcryptjs'

// ---------------------------------------------------------------------------
// Constantes y validaciones
// ---------------------------------------------------------------------------
const USERS_KEY = 'lukita_users'
const TOKEN_KEY = 'lukita_token'
const SALT_ROUNDS = 12
// Hash de relleno: se compara aunque el correo no exista, para que el tiempo de
// respuesta no revele si una cuenta esta registrada.
const DUMMY_HASH =
  '$2b$12$uR4PK791KBvSbJRHGXgbh.iIT9jssJxN4xntvyzt4c2yvI86z4j/a'

export const MIN_PASSWORD_LENGTH = 12
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
// Usuarios registrados (localStorage)
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

export async function registerUser({ name, email, password, usageType }) {
  if (isEmailRegistered(email)) throw new Error('EMAIL_TAKEN')

  const user = {
    name: String(name).trim(),
    email: normalizeEmail(email),
    usageType,
    passwordHash: await hash(password, SALT_ROUNDS),
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify([...getRegisteredUsers(), user]),
  )
  return user
}

// Devuelve el usuario si las credenciales son correctas; si no, null.
export async function authenticate(email, password) {
  const user = findUser(email)
  const matches = await compare(
    String(password),
    user?.passwordHash ?? DUMMY_HASH,
  )
  return user && matches ? user : null
}

// ---------------------------------------------------------------------------
// Sesion: token con formato JWT (header.payload.firma)
// OJO: la firma es solo una simulacion; la seguridad real vendra del servidor.
// ---------------------------------------------------------------------------
function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
}

// Hash FNV-1a de 32 bits (no es criptografico).
function sign(value) {
  let digest = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    digest ^= value.charCodeAt(index)
    digest = Math.imul(digest, 0x01000193)
  }
  return (digest >>> 0).toString(16).padStart(8, '0')
}

const readToken = () =>
  sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

// Devuelve los datos del token (sub, email, name, exp...) o null si no es valido.
export function getSession() {
  const token = readToken()
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3 || sign(`${parts[0]}.${parts[1]}`) !== parts[2]) {
    clearSession()
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]))
    if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
      clearSession()
      return null
    }
    return payload
  } catch {
    clearSession()
    return null
  }
}

// "Recordarme" guarda el token 7 dias en localStorage; si no, 1 hora en sessionStorage.
export function createSession(user, remember) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const lifetime = remember ? 60 * 60 * 24 * 7 : 60 * 60
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: user.email,
      email: user.email,
      name: user.name ?? '',
      iat: issuedAt,
      exp: issuedAt + lifetime,
    }),
  )
  const token = `${header}.${payload}.${sign(`${header}.${payload}`)}`

  clearSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
  return token
}

// Autenticacion de demostracion: usuarios y sesion se guardan en el navegador.
import { compare, hash } from 'bcryptjs'

const USERS_KEY = 'lukita_users'
const TOKEN_KEY = 'lukita_token'
const SALT_ROUNDS = 12
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

export function isDisposableEmail(email) {
  const domain = String(email ?? '').trim().toLowerCase().split('@').at(-1)
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

// Codificacion necesaria para crear una sesion local con formato similar a JWT.
function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function sign(value) {
  let digest = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    digest ^= value.charCodeAt(index)
    digest = Math.imul(digest, 0x01000193)
  }
  return (digest >>> 0).toString(16).padStart(8, '0')
}

export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    return Array.isArray(users) ? users : []
  } catch {
    return []
  }
}

export function findUser(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) return null
  return (
    getRegisteredUsers().find(
      (user) => String(user?.email).toLowerCase() === normalized,
    ) ?? null
  )
}

export function isEmailRegistered(email) {
  return Boolean(findUser(email))
}

export async function registerUser({ name, email, password, usageType }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const users = getRegisteredUsers()

  if (
    users.some(
      (user) => String(user?.email).toLowerCase() === normalizedEmail,
    )
  ) {
    throw new Error('EMAIL_TAKEN')
  }

  const passwordHash = await hash(password, SALT_ROUNDS)

  const user = {
    name: String(name).trim(),
    email: normalizedEmail,
    usageType,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
  return user
}

export async function authenticate(email, password) {
  const user = findUser(email)
  const passwordHash = user?.passwordHash ?? DUMMY_HASH
  const matches = await compare(String(password), passwordHash)

  if (!user || !matches) return null
  return user
}

function readToken() {
  return (
    sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
  )
}

export function getSession() {
  const token = readToken()
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) {
    clearSession()
    return null
  }

  const [encodedHeader, encodedPayload, signature] = parts

  if (sign(`${encodedHeader}.${encodedPayload}`) !== signature) {
    clearSession()
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload))
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

export function createSession(user, remember) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const ttl = remember ? 60 * 60 * 24 * 7 : 60 * 60
  const header = encodeBase64Url(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  )
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: user.email,
      email: user.email,
      name: user.name ?? '',
      iat: issuedAt,
      exp: issuedAt + ttl,
    }),
  )
  const token = `${header}.${payload}.${sign(`${header}.${payload}`)}`

  clearSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)

  return token
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

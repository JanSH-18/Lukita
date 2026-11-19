// Cliente minimo para el backend real (Node/Express/Prisma). Solo lo usan
// login/registro y el Asistente de voz; el resto del dashboard sigue en
// modo demo sobre financeStore.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function apiFetch(path, { token, body, isFormData, ...options } = {}) {
  const headers = { ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, data?.error ?? 'Ocurrió un error inesperado')
  return data
}

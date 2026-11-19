import { prisma } from './prisma.js'

// Usado por /recibos (vision-aula) y /voz (Groq): ambos le dan al modelo
// la lista de categorias de gasto del perfil para que intente calzarlas.
export async function categoriasDeGasto(perfilId) {
  const categorias = await prisma.categoria.findMany({
    where: { perfilId, tipo: 'gasto' },
    take: 40, // limite de vision-aula; se reusa el mismo tope para /voz
  })
  return categorias.map((c) => ({ id: String(c.id), nombre: c.nombre }))
}

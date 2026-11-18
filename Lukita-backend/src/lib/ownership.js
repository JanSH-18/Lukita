import { prisma } from './prisma.js'
import { HttpError } from '../utils/httpError.js'

// Confirma que el perfil de la URL exista y sea del usuario autenticado.
// Las rutas de cuentas/categorias/transacciones dependen de esto antes
// de leer o escribir nada, para que un usuario no vea datos de otro.
export async function getOwnedPerfil(perfilId, usuarioId) {
  const perfil = await prisma.perfil.findUnique({ where: { id: perfilId } })

  if (!perfil || perfil.usuarioId !== usuarioId) {
    throw new HttpError(404, 'Perfil no encontrado')
  }

  return perfil
}

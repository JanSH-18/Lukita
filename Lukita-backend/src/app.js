import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.routes.js'
import { perfilesRouter } from './routes/perfiles.routes.js'
import { cuentasRouter } from './routes/cuentas.routes.js'
import { categoriasRouter } from './routes/categorias.routes.js'
import { transaccionesRouter } from './routes/transacciones.routes.js'
import { recibosRouter } from './routes/recibos.routes.js'
import { requireAuth } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

// Los ids son bigint en Prisma; sin esto, JSON.stringify (y por lo tanto
// res.json) falla al intentar serializarlos.
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/perfiles', requireAuth, perfilesRouter)
app.use('/api/perfiles/:perfilId/cuentas', requireAuth, cuentasRouter)
app.use('/api/perfiles/:perfilId/categorias', requireAuth, categoriasRouter)
app.use('/api/perfiles/:perfilId/transacciones', requireAuth, transaccionesRouter)
app.use('/api/recibos', requireAuth, recibosRouter)

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use(errorHandler)

import { app } from './app.js'
import { env } from './config/env.js'

app.listen(env.port, () => {
  console.log(`Lukita backend escuchando en http://localhost:${env.port}`)
})

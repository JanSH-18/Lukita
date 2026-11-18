# Lukita - Backend

API en Node.js + Express + Prisma para el esquema de `../Lukita-BD.sql`.
Reemplaza al backend en Spring que se eliminó; por ahora cubre
autenticación y las operaciones base para que el frontend deje de usar
`localStorage`. La función de "foto a gasto" (hito 2 de la bitácora)
está declarada pero responde datos de prueba hasta tener credenciales
de Azure AI Foundry.

## Antes de arrancar

1. Tener una base de datos Postgres con el esquema `lukita` aplicado
   (correr `../Lukita-BD.sql` una vez).
2. `cp .env.example .env` y completar `DATABASE_URL` y `JWT_SECRET`.
3. `npm install`
4. `npx prisma generate`

Si cambian algo en `Lukita-BD.sql` directamente en la base de datos,
corran `npx prisma db pull` para que `prisma/schema.prisma` se
actualice solo — ese archivo se escribió a mano como punto de partida,
no es la fuente de verdad del esquema.

## Comandos

- `npm run dev`: servidor con reinicio automático (`node --watch`).
- `npm start`: servidor normal.
- `npm run prisma:generate`: regenera el cliente de Prisma tras tocar el schema.
- `npm run prisma:studio`: UI para ver/editar datos directamente.

## Estructura

```text
src/
  server.js          Arranca el servidor HTTP
  app.js             Arma la app de Express y monta las rutas
  config/env.js       Lee y valida las variables de entorno
  lib/prisma.js       Cliente de Prisma compartido
  lib/ownership.js     Confirma que un perfil sea del usuario autenticado
  middleware/auth.js         Verifica el JWT de "Authorization: Bearer ..."
  middleware/errorHandler.js Convierte errores en respuestas JSON
  routes/
    auth.routes.js         POST /api/auth/registro, /login
    perfiles.routes.js     GET/POST /api/perfiles
    cuentas.routes.js      GET/POST /api/perfiles/:perfilId/cuentas
    categorias.routes.js   GET/POST /api/perfiles/:perfilId/categorias
    transacciones.routes.js GET/POST /api/perfiles/:perfilId/transacciones
    recibos.routes.js      POST /api/recibos/analizar (foto -> gasto sugerido)
```

## Qué falta (para los alumnos)

- `recibos.routes.js`: conectar `analizarConFoundry` con el modelo de
  visión real en Azure AI Foundry cuando el crédito y el deployment
  estén listos. Hoy tira un error 501 si se intenta usar sin configurar
  y devuelve datos de prueba (`fuente: "mock"`) mientras tanto.
- Endpoints para `pagos_recurrentes`, `presupuestos` y `metas_ahorro`
  (el schema de Prisma ya los modela, solo faltan las rutas).
- Conectar el frontend (`Lukita-fronted`) a esta API en vez de
  `src/lib/financeStore.jsx` y `src/lib/auth.js`, que hoy usan
  `localStorage`.

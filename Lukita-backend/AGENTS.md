# AGENTS.md

## Stack
- Node.js (ESM, `"type": "module"`), Express 5, Prisma + Postgres.
- Validación de entrada con `zod` en cada ruta; los `check (...)` del SQL
  no existen en el schema de Prisma, así que la validación de app es la
  única barrera además de la base de datos.
- Autenticación por JWT (`Authorization: Bearer <token>`), passwords con
  `bcryptjs`.
- No hay TypeScript ni test suite todavía.

## Comandos
- `npm run dev` - servidor con `node --watch`
- `npm start` - servidor normal
- `npm run prisma:generate` - regenerar el cliente tras tocar `prisma/schema.prisma`
- `npm run prisma:migrate` - crear y aplicar una migración (requiere `DATABASE_URL`)
- No inventen scripts de `test`, `lint` ni `build`: no existen.

## Reglas
- Responde siempre en español.
- Cada ruta de escritura valida con `zod` antes de tocar Prisma.
- Las rutas bajo `/api/perfiles/:perfilId/...` deben llamar a
  `getOwnedPerfil` (en `src/lib/ownership.js`) antes de leer o escribir
  nada: un usuario nunca debe poder ver datos de otro perfil.
- Usa datos de prueba para probar, nunca credenciales ni datos reales.
- Explica qué archivos cambias y por qué.

## Gotchas
- Los ids son `BigInt` en Prisma (coinciden con `bigint generated always
  as identity` del SQL). `app.js` parchea `BigInt.prototype.toJSON` para
  que `res.json` no truene; no lo quites.
- `prisma/schema.prisma` se escribió a mano a partir de
  `../Lukita-BD.sql`. Si alguna vez se corre `prisma db pull` contra una
  base real, ese comando reemplaza este archivo — es lo esperado.
- El índice único real de `usuarios.email` es sobre `lower(email)`; por
  eso `auth.routes.js` normaliza el correo a minúsculas antes de
  guardar o comparar. No agregues otra forma de comparar emails.
- `POST /api/auth/registro` usa los mismos nombres de campo que
  `registerUser` en `Lukita-fronted/src/lib/auth.js` (`name`, `usageType`,
  `ruc`), a propósito, para que cambiar esa función por un `fetch` a esta
  API sea casi un copy-paste. El resto de la API sí usa nombres en
  español (`tipo`, `perfilId`, etc.) como el resto del dominio.
- `ruc` vive en `perfiles` (no en `usuarios`): es un dato del perfil
  empresarial, igual que en el frontend. Se agregó esa columna a
  `../Lukita-BD.sql` — si alguien ya tiene una base creada con la
  versión vieja del SQL, necesita un `alter table perfiles add column
  ruc varchar(11);` antes de levantar esta API.
- `recibos.routes.js` no tiene todavía la llamada real a Azure AI
  Foundry (`analizarConFoundry` lanza un 501 a propósito). No la
  reemplacen por una llamada a Jev: ese endpoint solo acepta texto, no
  imágenes.
- `Lukita-backend` es un subproyecto hermano de `Lukita-fronted`; la
  raíz del repo de Git es su carpeta padre (`Lukita`).

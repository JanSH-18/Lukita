# AGENTS.md

## Stack
- Vite 8 + React 19, plain JavaScript/JSX. No TypeScript, no test suite.
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin in `vite.config.js`.
- Entry flow: `index.html` -> `src/main.jsx` -> `src/App.jsx`.
- `src/index.css` holds global styles (currently only `@import "tailwindcss";`); component styling uses Tailwind classes in JSX.
- `README.md` documents the current frontend structure and where to make changes.

## Commands
- `npm run dev` - Vite dev server (default http://localhost:5173)
- `npm run build` - production build to `dist/`
- `npm run lint` - ESLint over `**/*.{js,jsx}`; run before finishing changes
- There are no `test`, `typecheck`, format, or codegen scripts. Do not invent them.
- Vite 8 requires Node `^20.19.0 || >=22.12.0`.

## Reglas
- Responde siempre en español.
- Usa solo React y Tailwind; no agregues otras librerias de UI o estilos.
- Cada pantalla debe cumplir los criterios de aceptacion de su historia.
- Explica que archivos cambias y por que.
- Usa datos de prueba, nunca datos reales.

## Gotchas
- Tailwind v4 has no `tailwind.config.js` and no PostCSS config. Customize the theme in CSS (`@theme` in `src/index.css`), not a JS config.
- The `tailwind` package in dependencies is an unrelated "CQS applications" module, not Tailwind CSS. Do not import it (or `css`); neither is used.
- Do not copy existing class names such as `text-3x1` and `text-blue 600` in `src/App.jsx` - they are invalid Tailwind (likely meant `text-3xl` / `text-blue-600`).
- Files in `public/` are served at `/` (`/icons.svg`, `/favicon.svg`); images imported by components live in `src/assets/`.
- `dist/` is ignored by Git and ESLint.
- `Lukita-fronted` is the frontend subproject; the Git repository root is its parent directory (`Lukita`).

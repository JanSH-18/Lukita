# AGENTS.md

## Stack
- Vite 8 + React 19, plain JavaScript/JSX. No TypeScript, no test suite.
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin in `vite.config.js`.
- Entry flow: `index.html` -> `src/main.jsx` -> `src/App.jsx`.
- `src/index.css` holds global styles (currently only `@import "tailwindcss";`); `src/App.css` holds component styles.
- `README.md` is the stock Vite template; trust `package.json` and `vite.config.js` over it.

## Commands
- `npm run dev` - Vite dev server (default http://localhost:5173)
- `npm run build` - production build to `dist/`
- `npm run lint` - ESLint over `**/*.{js,jsx}`; run before finishing changes
- There are no `test`, `typecheck`, format, or codegen scripts. Do not invent them.
- Vite 8 requires Node `^20.19.0 || >=22.12.0`.

## Gotchas
- Tailwind v4 has no `tailwind.config.js` and no PostCSS config. Customize the theme in CSS (`@theme` in `src/index.css`), not a JS config.
- The `tailwind` package in dependencies is an unrelated "CQS applications" module, not Tailwind CSS. Do not import it (or `css`); neither is used.
- Do not copy existing class names such as `text-3x1` and `text-blue 600` in `src/App.jsx` - they are invalid Tailwind (likely meant `text-3xl` / `text-blue-600`).
- Files in `public/` are served at `/` (`/icons.svg`, `/favicon.svg`); images imported by components live in `src/assets/`.
- `dist/` is ignored by Git and ESLint.
- This directory is not a Git repository, so there is no commit history or Git workflow here.

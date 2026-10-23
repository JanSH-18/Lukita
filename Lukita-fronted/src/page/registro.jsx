import { useState } from 'react'
import { hash } from 'bcryptjs'

const USERS_KEY = 'lukita_users'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 12
const SALT_ROUNDS = 12

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    return Array.isArray(users) ? users : []
  } catch {
    return []
  }
}

function isEmailRegistered(email) {
  return getRegisteredUsers().some(
    (user) => String(user?.email).toLowerCase() === email,
  )
}

function saveUser(user) {
  const users = getRegisteredUsers()
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
}

function MailIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function EyeIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4.1" />
      <path d="M6.2 6.2A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4.1-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

function Registro({ onNavigateToLogin }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const goToLogin =
    onNavigateToLogin ??
    (() => {
      window.location.hash = '#/login'
    })

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
    setSuccess('')
  }

  function validate() {
    const nextErrors = {}
    const email = form.email.trim().toLowerCase()

    if (!email) {
      nextErrors.email = 'El correo es obligatorio.'
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = 'Ingresa un correo con una sintaxis válida.'
    } else if (isEmailRegistered(email)) {
      nextErrors.email = 'Este correo ya está registrado.'
    }

    if (!form.password) {
      nextErrors.password = 'La contraseña es obligatoria.'
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirma tu contraseña.'
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setSuccess('')

    if (!validate()) return

    setLoading(true)

    try {
      const email = form.email.trim().toLowerCase()

      if (isEmailRegistered(email)) {
        setErrors({ email: 'Este correo ya está registrado.' })
        return
      }

      const passwordHash = await hash(form.password, SALT_ROUNDS)

      saveUser({
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      })

      setForm({ email: '', password: '', confirmPassword: '' })
      setSuccess('¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...')

      window.setTimeout(goToLogin, 1400)
    } catch {
      setFormError(
        'No se pudo crear la cuenta. Inténtalo de nuevo en unos momentos.',
      )
    } finally {
      setLoading(false)
    }
  }

  const passwordLongEnough =
    form.password.length >= MIN_PASSWORD_LENGTH
  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <header className="mb-8 text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl font-black text-emerald-400 ring-1 ring-emerald-400/30">
            L
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Guarda y controla tu información financiera de forma segura.
          </p>
        </header>

        {formError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {formError}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full rounded-xl border bg-slate-900/60 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:ring-2 ${
                  errors.email
                    ? 'border-red-500/60 focus:border-red-400 focus:ring-red-500/30'
                    : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-500/30'
                }`}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-2 text-xs text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 12 caracteres"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? 'password-error' : 'password-hint'
                }
                className={`w-full rounded-xl border bg-slate-900/60 py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:ring-2 ${
                  errors.password
                    ? 'border-red-500/60 focus:border-red-400 focus:ring-red-500/30'
                    : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-500/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p id="password-error" className="mt-2 text-xs text-red-400">
                {errors.password}
              </p>
            ) : (
              <p
                id="password-hint"
                className={`mt-2 flex items-center gap-1.5 text-xs ${
                  passwordLongEnough ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <span aria-hidden="true">
                  {passwordLongEnough ? '✓' : '•'}
                </span>
                Mínimo {MIN_PASSWORD_LENGTH} caracteres
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? 'confirm-error' : undefined
                }
                className={`w-full rounded-xl border bg-slate-900/60 py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:ring-2 ${
                  errors.confirmPassword
                    ? 'border-red-500/60 focus:border-red-400 focus:ring-red-500/30'
                    : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-500/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={
                  showConfirmPassword
                    ? 'Ocultar confirmación de contraseña'
                    : 'Mostrar confirmación de contraseña'
                }
                aria-pressed={showConfirmPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p id="confirm-error" className="mt-2 text-xs text-red-400">
                {errors.confirmPassword}
              </p>
            ) : (
              passwordsMatch && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                  <span aria-hidden="true">✓</span>
                  Las contraseñas coinciden
                </p>
              )
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900"
                aria-hidden="true"
              />
            )}
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes una cuenta?{' '}
          <a
            href="#/login"
            onClick={(event) => {
              event.preventDefault()
              goToLogin()
            }}
            className="font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            Inicia sesión
          </a>
        </p>
      </section>
    </main>
  )
}

export default Registro

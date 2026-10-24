import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { authenticate, createSession } from '../lib/auth'

const inputClass =
  'w-full rounded-lg border border-[#e2e5ea] bg-[#f3f4f6] px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2f4bb5] focus:bg-white focus:ring-2 focus:ring-[#2f4bb5]/20'

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.39l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.94A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.94V7.47H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.53l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.51 3.82 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.47l3.35 2.59C7.2 7.7 9.4 5.94 12 5.94Z"
      />
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

function Login({ notice, onDismissNotice }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setInfo('')
    setSuccess('')
    onDismissNotice?.()
  }

  function showInfo(message) {
    setError('')
    setSuccess('')
    setInfo(message)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setInfo('')
    setSuccess('')

    if (!form.email.trim() || !form.password) {
      setError('Ingresa tu correo y tu contraseña.')
      return
    }

    setLoading(true)

    try {
      const user = await authenticate(form.email, form.password)

      if (!user) {
        setError('Correo o contraseña incorrectos.')
        return
      }

      createSession(user, remember)
      const displayName = user.name?.trim() || user.email
      setSuccess(
        `¡Inicio de sesión exitoso! Bienvenido, ${displayName}. Redirigiendo...`,
      )

      window.setTimeout(() => {
        window.location.hash = '#/app'
      }, 1000)
    } catch {
      setError('No pudimos verificar tus datos. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Toma el control de tu dinero"
      subtitle="Registra ingresos y gastos, crea presupuestos y alcanza tus metas de ahorro, para tu vida personal o tu negocio."
    >
      <header className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
          Bienvenido de nuevo
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Ingresa tus datos para ver tus finanzas
        </p>
      </header>

      {notice && (
        <div
          role="status"
          className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={onDismissNotice}
            aria-label="Cerrar mensaje"
            className="rounded text-emerald-500 transition hover:text-emerald-700"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {info && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-700"
        >
          {info}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Correo electrónico
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="tucorreo@ejemplo.com"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Contraseña
            </label>
            <button
              type="button"
              onClick={() =>
                showInfo(
                  'La recuperación de contraseña estará disponible próximamente.',
                )
              }
              className="text-xs font-medium text-[#1f3fa8] transition hover:text-[#162d7d]"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-[#2f4bb5]"
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-[#1f2f7a]"
          />
          Recordarme en este equipo
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f2f7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#273a92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2f7a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {loading ? 'Verificando...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] text-slate-400">o continúa con</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() =>
          showInfo('El acceso con Google estará disponible próximamente.')
        }
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <GoogleIcon className="h-4 w-4" />
        Continuar con Google
      </button>

      <p className="mt-6 text-center text-xs text-slate-500">
        ¿No tienes cuenta?{' '}
        <a
          href="#/registro"
          className="font-semibold text-[#1f3fa8] transition hover:text-[#162d7d]"
        >
          Regístrate
        </a>
      </p>
    </AuthLayout>
  )
}

export default Login

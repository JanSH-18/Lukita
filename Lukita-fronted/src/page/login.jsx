import { useState } from 'react'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import {
  authenticate,
  createSession,
  EMAIL_REGEX,
  isDisposableEmail,
  MIN_PASSWORD_LENGTH,
} from '../lib/auth'

const inputClass =
  'w-full rounded-lg border border-[#e2e5ea] bg-[#f3f4f6] px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2f4bb5] focus:bg-white focus:ring-2 focus:ring-[#2f4bb5]/20'

function Login({ notice, onDismissNotice, onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [credentialsInvalid, setCredentialsInvalid] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setCredentialsInvalid(false)
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
    setCredentialsInvalid(false)

    const nextErrors = {}
    const email = form.email.trim()

    if (!email) {
      nextErrors.email = 'Ingresa tu correo electrónico.'
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email =
        'Ingresa un correo válido, por ejemplo nombre@dominio.com.'
    } else if (isDisposableEmail(email)) {
      nextErrors.email =
        'No se permite el ingreso con correos falsos o dominios sospechosos.'
    }

    if (!form.password) {
      nextErrors.password = 'Ingresa tu contraseña.'
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      const user = await authenticate(form.email, form.password)

      if (!user) {
        setError('Correo o contraseña incorrectos.')
        setCredentialsInvalid(true)
        return
      }

      createSession(user, remember)
      const displayName = user.name?.trim() || user.email
      setSuccess(
        `¡Inicio de sesión exitoso! Bienvenido, ${displayName}. Redirigiendo...`,
      )

      window.setTimeout(() => {
        onLogin?.(user)
        navigate('/app', { replace: true })
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
            aria-invalid={Boolean(fieldErrors.email) || credentialsInvalid}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            className={`${inputClass} ${
              fieldErrors.email || credentialsInvalid
                ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200'
                : ''
            }`}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="mt-1.5 text-[11px] text-red-600">
              {fieldErrors.email}
            </p>
          )}
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
              aria-invalid={
                Boolean(fieldErrors.password) || credentialsInvalid
              }
              aria-describedby={
                fieldErrors.password ? 'login-password-error' : undefined
              }
              className={`${inputClass} pr-11 ${
                fieldErrors.password || credentialsInvalid
                  ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200'
                  : ''
              }`}
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
                <EyeOff className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p
              id="login-password-error"
              className="mt-1.5 text-[11px] text-red-600"
            >
              {fieldErrors.password}
            </p>
          )}
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
        <Globe className="h-4 w-4" aria-hidden="true" />
        Continuar con Google
      </button>

      <p className="mt-6 text-center text-xs text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link
          to="/registro"
          className="font-semibold text-[#1f3fa8] transition hover:text-[#162d7d]"
        >
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login

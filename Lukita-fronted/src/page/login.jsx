// Inicio de sesion (HU-2): valida el formulario, abre la sesion y entra al dashboard.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import {
  AuthAlert,
  AuthField,
  AuthSubmitButton,
  PasswordField,
  SocialLogin,
} from '../components/AuthControls'
import {
  authenticate,
  createSession,
  EMAIL_REGEX,
  isDisposableEmail,
  MIN_PASSWORD_LENGTH,
} from '../lib/auth'

const REDIRECT_DELAY_MS = 1000

function validateLogin({ email, password }) {
  const errors = {}
  const cleanEmail = email.trim()

  if (!cleanEmail) {
    errors.email = 'Ingresa tu correo electrónico.'
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = 'Ingresa un correo válido, por ejemplo nombre@dominio.com.'
  } else if (isDisposableEmail(cleanEmail)) {
    errors.email = 'No se permite el ingreso con correos falsos o dominios sospechosos.'
  }

  if (!password) {
    errors.password = 'Ingresa tu contraseña.'
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  return errors
}

function Login({ notice, onDismissNotice, onLogin }) {
  const navigate = useNavigate()
  const redirectTimer = useRef(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [fieldErrors, setFieldErrors] = useState({})
  const [credentialsInvalid, setCredentialsInvalid] = useState(false)
  // Un solo mensaje a la vez: { tone: 'error' | 'info' | 'success', text }
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  // Si se sale de la pantalla antes de redirigir, se cancela el temporizador.
  useEffect(() => () => window.clearTimeout(redirectTimer.current), [])

  function handleChange(event) {
    if (loading) return
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setCredentialsInvalid(false)
    setAlert(null)
    if (notice) onDismissNotice?.()
  }

  const showInfo = (text) => setAlert({ tone: 'info', text })

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return
    setAlert(null)
    setCredentialsInvalid(false)

    const errors = validateLogin(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    try {
      const user = await authenticate(form.email, form.password)

      if (!user) {
        setAlert({ tone: 'error', text: 'Correo o contraseña incorrectos.' })
        setCredentialsInvalid(true)
        setLoading(false)
        return
      }

      createSession(user, remember)
      const displayName = user.name?.trim() || user.email
      setAlert({
        tone: 'success',
        text: `¡Inicio de sesión exitoso! Bienvenido, ${displayName}. Redirigiendo...`,
      })

      // El boton sigue bloqueado hasta cambiar de pantalla (evita doble envio).
      redirectTimer.current = window.setTimeout(() => {
        onLogin()
        navigate('/app', { replace: true })
      }, REDIRECT_DELAY_MS)
    } catch {
      setAlert({
        tone: 'error',
        text: 'No pudimos verificar tus datos. Inténtalo de nuevo.',
      })
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

      <AuthAlert tone="success" onClose={onDismissNotice}>
        {notice}
      </AuthAlert>
      <AuthAlert tone={alert?.tone}>{alert?.text}</AuthAlert>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          id="login-email"
          name="email"
          type="email"
          label="Correo electrónico"
          autoComplete="username"
          placeholder="tucorreo@ejemplo.com"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
          invalid={credentialsInvalid}
        />

        <PasswordField
          id="login-password"
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          invalid={credentialsInvalid}
          labelAction={
            <button
              type="button"
              onClick={() =>
                showInfo('La recuperación de contraseña estará disponible próximamente.')
              }
              className="text-xs font-medium text-[#1f3fa8] transition hover:text-[#162d7d]"
            >
              ¿Olvidaste tu contraseña?
            </button>
          }
        />

        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-[#1f2f7a]"
          />
          Recordarme en este equipo
        </label>

        <AuthSubmitButton loading={loading} loadingText="Verificando...">
          Iniciar sesión
        </AuthSubmitButton>
      </form>

      <SocialLogin
        onClick={() => showInfo('El acceso con Google estará disponible próximamente.')}
      />

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

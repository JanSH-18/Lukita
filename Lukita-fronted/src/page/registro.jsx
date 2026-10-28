// Registro de usuario demo; valida el formulario y delega el guardado a auth.js.
import { useState } from 'react'
import { Globe } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import {
  inputClass,
  PasswordVisibilityIcon,
} from '../components/AuthControls'
import {
  EMAIL_REGEX,
  isDisposableEmail,
  MIN_PASSWORD_LENGTH,
  isEmailRegistered,
  registerUser,
} from '../lib/auth'

const errorInputClass =
  'border-red-300 focus:border-red-400 focus:ring-red-200'

function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [usageType, setUsageType] = useState('personal')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
    setSuccess('')
  }

  function validate() {
    const nextErrors = {}
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()

    if (!name) {
      nextErrors.name = 'Ingresa tu nombre completo.'
    }

    if (!email) {
      nextErrors.email = 'El correo es obligatorio.'
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = 'Ingresa un correo con una sintaxis válida.'
    } else if (isDisposableEmail(email)) {
      nextErrors.email =
        'No se permite registrar correos falsos o dominios sospechosos.'
    } else if (isEmailRegistered(email)) {
      nextErrors.email = 'Este correo ya está registrado.'
    }

    if (!form.password) {
      nextErrors.password = 'La contraseña es obligatoria.'
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirma tu contraseña.'
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    if (!acceptedTerms) {
      nextErrors.terms = 'Debes aceptar los términos y la política de privacidad.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (success) return
    setFormError('')
    setSuccess('')

    if (!validate()) return

    setLoading(true)

    try {
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        usageType,
      })

      setSuccess('¡Cuenta creada con éxito! Ya puedes iniciar sesión.')
    } catch (error) {
      if (error?.message === 'EMAIL_TAKEN') {
        setErrors((current) => ({
          ...current,
          email: 'Este correo ya está registrado.',
        }))
      } else {
        setFormError(
          'No se pudo crear la cuenta. Inténtalo de nuevo en unos momentos.',
        )
      }
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
          Crea tu cuenta
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Empieza a organizar tus finanzas hoy
        </p>
      </header>

      {formError && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
        >
          {formError}
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
            htmlFor="reg-name"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Nombre completo
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre y apellido"
            value={form.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            className={`${inputClass} ${
              errors.name
                ? errorInputClass
                : success
                  ? 'border-green-500 bg-green-50'
                  : ''
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-[11px] text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Correo electrónico
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            className={`${inputClass} ${
              errors.email
                ? errorInputClass
                : success
                  ? 'border-green-500 bg-green-50'
                  : ''
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-[11px] text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">
            Tipo de uso
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUsageType('personal')}
              aria-pressed={usageType === 'personal'}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                usageType === 'personal'
                  ? 'border-[#1f2f7a] bg-[#1f2f7a] text-white'
                  : 'border-[#e2e5ea] bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setUsageType('empresarial')}
              aria-pressed={usageType === 'empresarial'}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                usageType === 'empresarial'
                  ? 'border-[#1f2f7a] bg-[#1f2f7a] text-white'
                  : 'border-[#e2e5ea] bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Empresarial
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="reg-password"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mín. 12 caracteres"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                className={`${inputClass} pr-9 text-xs ${
                  errors.password ? errorInputClass : ''
                } ${success ? 'border-green-500 bg-green-50' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-[#2f4bb5]"
              >
                <PasswordVisibilityIcon
                  visible={showPassword}
                  className="h-4 w-4"
                />
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-[11px] text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-confirm"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repite contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(errors.confirmPassword)}
                className={`${inputClass} pr-9 text-xs ${
                  errors.confirmPassword ? errorInputClass : ''
                } ${success ? 'border-green-500 bg-green-50' : ''}`}
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
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-[#2f4bb5]"
              >
                <PasswordVisibilityIcon
                  visible={showConfirmPassword}
                  className="h-4 w-4"
                />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-[11px] text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked)
                setErrors((current) => ({ ...current, terms: '' }))
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1f2f7a]"
            />
            <span>
              Acepto los{' '}
              <span className="font-medium text-[#1f3fa8]">términos</span> y la{' '}
              <span className="font-medium text-[#1f3fa8]">
                política de privacidad
              </span>
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1.5 text-[11px] text-red-500">{errors.terms}</p>
          )}
        </div>

        <button
          type={success ? 'button' : 'submit'}
          onClick={
            success
              ? () => {
                  navigate('/login', { replace: true })
                }
              : undefined
          }
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f2f7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#273a92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2f7a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {loading
            ? 'Creando cuenta...'
            : success
              ? 'Ir a iniciar sesión'
              : 'Crear cuenta'}
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
          setFormError('El registro con Google estará disponible próximamente.')
        }
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        Continuar con Google
      </button>

      <p className="mt-6 text-center text-xs text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#1f3fa8] transition hover:text-[#162d7d]"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Registro

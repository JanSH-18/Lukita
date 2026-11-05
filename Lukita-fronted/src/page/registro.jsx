// Registro de usuario (HU-1): valida el formulario y delega el guardado a auth.js.
import { useState } from 'react'
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
  EMAIL_REGEX,
  isDisposableEmail,
  isEmailRegistered,
  MIN_PASSWORD_LENGTH,
  registerUser,
} from '../lib/auth'

const USAGE_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'empresarial', label: 'Empresarial' },
]

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '' }

function validateRegistro(form, acceptedTerms) {
  const errors = {}
  const email = form.email.trim().toLowerCase()

  if (!form.name.trim()) errors.name = 'Ingresa tu nombre completo.'

  if (!email) {
    errors.email = 'El correo es obligatorio.'
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Ingresa un correo con una sintaxis válida.'
  } else if (isDisposableEmail(email)) {
    errors.email = 'No se permite registrar correos falsos o dominios sospechosos.'
  } else if (isEmailRegistered(email)) {
    errors.email = 'Este correo ya está registrado.'
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria.'
  } else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  if (!acceptedTerms) {
    errors.terms = 'Debes aceptar los términos y la política de privacidad.'
  }

  return errors
}

function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [usageType, setUsageType] = useState('personal')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState({})
  // Un solo mensaje a la vez: { tone: 'error' | 'info' | 'success', text }
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  const created = alert?.tone === 'success'
  // Con la cuenta creada el formulario queda bloqueado: no se puede enviar dos veces.
  const locked = loading || created

  function handleChange(event) {
    if (locked) return
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setAlert(null)
  }

  function handleTermsChange(event) {
    if (locked) return
    setAcceptedTerms(event.target.checked)
    setErrors((current) => ({ ...current, terms: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (locked) return
    setAlert(null)

    const nextErrors = validateRegistro(form, acceptedTerms)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      await registerUser({ ...form, usageType })
      setAlert({
        tone: 'success',
        text: '¡Cuenta creada con éxito! Ya puedes iniciar sesión.',
      })
    } catch (error) {
      if (error?.message === 'EMAIL_TAKEN') {
        setErrors((current) => ({ ...current, email: 'Este correo ya está registrado.' }))
      } else {
        setAlert({
          tone: 'error',
          text: 'No se pudo crear la cuenta. Inténtalo de nuevo en unos momentos.',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Props comunes de los campos de texto.
  const field = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    error: errors[name],
    valid: created,
    readOnly: locked,
  })

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

      <AuthAlert tone={alert?.tone}>{alert?.text}</AuthAlert>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          id="reg-name"
          type="text"
          label="Nombre completo"
          autoComplete="name"
          placeholder="Tu nombre y apellido"
          {...field('name')}
        />

        <AuthField
          id="reg-email"
          type="email"
          label="Correo electrónico"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          {...field('email')}
        />

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">
            Tipo de uso
          </span>
          <div className="grid grid-cols-2 gap-3">
            {USAGE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={locked}
                onClick={() => setUsageType(value)}
                aria-pressed={usageType === value}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  usageType === value
                    ? 'border-[#1f2f7a] bg-[#1f2f7a] text-white'
                    : 'border-[#e2e5ea] bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PasswordField
            id="reg-password"
            label="Contraseña"
            autoComplete="new-password"
            placeholder="Mín. 12 caracteres"
            compact
            {...field('password')}
          />
          <PasswordField
            id="reg-confirm"
            label="Confirmar contraseña"
            autoComplete="new-password"
            placeholder="Repite contraseña"
            showLabel="Mostrar confirmación de contraseña"
            hideLabel="Ocultar confirmación de contraseña"
            compact
            {...field('confirmPassword')}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={handleTermsChange}
              disabled={locked}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1f2f7a]"
            />
            <span>
              Acepto los <span className="font-medium text-[#1f3fa8]">términos</span> y
              la{' '}
              <span className="font-medium text-[#1f3fa8]">política de privacidad</span>
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1.5 text-[11px] text-red-600">{errors.terms}</p>
          )}
        </div>

        {created ? (
          // Tras crear la cuenta, el boton lleva al inicio de sesion.
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f2f7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#273a92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2f7a]"
          >
            Ir a iniciar sesión
          </button>
        ) : (
          <AuthSubmitButton loading={loading} loadingText="Creando cuenta...">
            Crear cuenta
          </AuthSubmitButton>
        )}
      </form>

      <SocialLogin
        onClick={() =>
          setAlert({
            tone: 'info',
            text: 'El registro con Google estará disponible próximamente.',
          })
        }
      />

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

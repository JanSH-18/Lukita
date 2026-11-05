// Controles compartidos por login y registro: campos, alertas y botones.
import { useState } from 'react'
import { Eye, EyeOff, Globe } from 'lucide-react'

const inputClass =
  'w-full rounded-lg border border-[#e2e5ea] bg-[#f3f4f6] px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2f4bb5] focus:bg-white focus:ring-2 focus:ring-[#2f4bb5]/20'
const invalidClass =
  'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-200'
const validClass = 'border-green-500 bg-green-50'

const ALERT_STYLES = {
  error: 'border-red-200 bg-red-50 text-red-600',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

// Mensaje de estado sobre el formulario; no dibuja nada si no hay texto.
// Con `onClose` se agrega un boton para cerrarlo.
export function AuthAlert({ tone = 'info', onClose, children }) {
  if (!children) return null
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mb-5 flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${ALERT_STYLES[tone]}`}
    >
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar mensaje"
          className="rounded opacity-70 transition hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}

// Campo con etiqueta, mensaje de error y (opcional) un control a la derecha.
// `invalid` pinta el campo en rojo sin mostrar texto; `valid` lo pinta en verde.
export function AuthField({
  id,
  label,
  labelAction,
  error,
  invalid = false,
  valid = false,
  compact = false,
  adornment,
  ...inputProps
}) {
  const isInvalid = invalid || Boolean(error)
  const stateClass = isInvalid ? invalidClass : valid ? validClass : ''
  const sizeClass = adornment ? (compact ? 'pr-9 text-xs' : 'pr-11') : ''

  return (
    <div>
      <div
        className={
          labelAction ? 'mb-1.5 flex items-center justify-between gap-3' : undefined
        }
      >
        <label
          htmlFor={id}
          className={`block text-xs font-semibold text-slate-700 ${
            labelAction ? '' : 'mb-1.5'
          }`}
        >
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          aria-invalid={isInvalid}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass} ${sizeClass} ${stateClass}`}
          {...inputProps}
        />
        {adornment}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11px] text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

// Campo de contrasena con boton para mostrar u ocultar el texto.
export function PasswordField({
  showLabel = 'Mostrar contraseña',
  hideLabel = 'Ocultar contraseña',
  compact = false,
  ...fieldProps
}) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <AuthField
      {...fieldProps}
      compact={compact}
      type={visible ? 'text' : 'password'}
      adornment={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-[#2f4bb5] ${
            compact ? 'right-1.5' : 'right-2'
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        </button>
      }
    />
  )
}

export function AuthSubmitButton({ loading, loadingText, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f2f7a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#273a92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f2f7a] disabled:cursor-not-allowed disabled:opacity-70"
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {loading ? loadingText : children}
    </button>
  )
}

// Separador "o continua con" + boton de Google (aun sin funcionalidad).
export function SocialLogin({ onClick }) {
  return (
    <>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] text-slate-400">o continúa con</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        Continuar con Google
      </button>
    </>
  )
}

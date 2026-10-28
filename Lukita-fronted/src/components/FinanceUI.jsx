// Primitivas visuales reutilizadas por todas las vistas del dashboard.
import { X } from 'lucide-react'

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-[#29469a] focus:bg-white focus:ring-2 focus:ring-[#29469a]/15'

export function PageHeading({ title, subtitle, action }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p>
      </div>
      {action}
    </header>
  )
}

export function Card({ children, className = '' }) {
  return <section className={`min-w-0 rounded-2xl bg-white p-5 shadow-[0_12px_36px_-26px_rgba(15,23,42,.35)] sm:p-6 ${className}`}>{children}</section>
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-[#203c91] text-white shadow-[0_8px_16px_-10px_rgba(31,47,122,.8)] hover:bg-[#172f7c]',
    secondary: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-[#203c91] hover:bg-indigo-50',
  }
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29469a] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, error, className = '', children, ...props }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</span>}
      {children || (
        <input className={`${inputClass} ${error ? 'border-red-400 bg-red-50' : ''}`} {...props} />
      )}
      {error && <span className="mt-1 block text-xs text-red-600" role="alert">{error}</span>}
    </label>
  )
}

export function SelectField({ label, options, className = '', ...props }) {
  return (
    <Field label={label} className={className}>
      <select className={inputClass} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  )
}

export function Modal({ title, onClose, children, className = '' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7 ${className}`}
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function Notice({ children, tone = 'info' }) {
  const tones = {
    info: 'border-blue-100 bg-blue-50 text-blue-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</p>
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl bg-slate-100 px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-[#203c91]">+</div>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

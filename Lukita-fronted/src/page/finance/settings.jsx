// Perfil, preferencias y navegacion a las demas secciones de la demo.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import {
  Button,
  Card,
  Field,
  Notice,
  PageHeading,
  SelectField,
} from '../../components/FinanceUI'
import { useFinance } from '../../lib/financeStore'
import { PROFILES, PROFILE_LABELS } from '../../lib/financeUtils'
import { getUserRuc, updateUserRuc } from '../../lib/auth'
import { getRucError, onlyDigits, RUC_LENGTH_DIGITS } from '../../lib/ruc'

const toOptions = (values) => values.map((value) => ({ value, label: value }))

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'Dólar ($)' },
  { value: 'PEN', label: 'Sol (S/)' },
  { value: 'EUR', label: 'Euro (€)' },
]

const NOTIFICATION_TOGGLES = [
  {
    key: 'budgetAlerts',
    title: 'Alertas de presupuesto',
    description: 'Avisarme al llegar al 80% y al superar el 100%',
  },
  {
    key: 'recurringAlerts',
    title: 'Recordatorios de pagos recurrentes',
    description: 'Avisarme antes de cada vencimiento',
  },
  {
    key: 'fixedExpenseAlerts',
    title: 'Recordatorio mensual de gastos fijos',
    description: 'Avisarme a fin de mes para registrar mis gastos',
  },
  {
    key: 'weeklySummary',
    title: 'Resumen semanal por correo',
    description: 'Recibir un resumen de mis movimientos',
  },
]

// Secciones que no caben en la barra inferior del movil.
const MORE_ITEMS = [
  { label: 'Mi dinero', to: '/app/mi-dinero', description: 'Administrar ingresos y egresos' },
  { label: 'Gastos extras', to: '/app/gastos-extras', description: 'Controlar gastos ocasionales' },
  { label: 'Categorías', to: '/app/categorias', description: 'Organizar movimientos' },
  { label: 'Metas de ahorro', to: '/app/metas-de-ahorro', description: 'Seguir objetivos de ahorro' },
  { label: 'Recurrentes', to: '/app/recurrentes', description: 'Pagos y cobros programados' },
  { label: 'Cuentas', to: '/app/cuentas', description: 'Cuentas y perfiles' },
  { label: 'Reportes', to: '/app/reportes', description: 'Resumen y exportación' },
  { label: 'Configuración', to: '/app/configuracion', description: 'Perfil y preferencias' },
]

// ---------------------------------------------------------------------------
// Configuracion
// ---------------------------------------------------------------------------
function ProfileCard({ session, profile, onNotice }) {
  const [name, setName] = useState(session?.name ?? '')
  const [ruc, setRuc] = useState(() => getUserRuc(session?.email))
  const [rucError, setRucError] = useState('')
  const initials = (name || session?.email || 'LU').slice(0, 2).toUpperCase()
  const isBusiness = profile === 'empresarial'

  function handleSubmit(event) {
    event.preventDefault()
    // El RUC es opcional aqui, pero si se escribe debe ser valido.
    if (isBusiness && ruc) {
      const message = getRucError(ruc)
      if (message) return setRucError(message)
    }
    if (isBusiness) updateUserRuc(session.email, ruc)
    onNotice('Perfil demo actualizado para esta pantalla.')
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">Mi perfil</h2>
      <div className="mb-5 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-[#203c91]">
          {initials}
        </span>
        <div>
          <p className="font-bold">{name || session?.name || 'Usuario'}</p>
          <Button
            variant="secondary"
            className="mt-2 min-h-8 px-3 text-xs"
            onClick={() => onNotice('La carga de foto estará disponible en una futura versión.')}
          >
            Cambiar foto
          </Button>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="Nombre completo"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Field label="Correo electrónico" value={session?.email ?? ''} readOnly />
        {isBusiness && (
          <Field
            label="RUC de la empresa"
            inputMode="numeric"
            maxLength={RUC_LENGTH_DIGITS}
            placeholder="Ej. 20123456789"
            value={ruc}
            onChange={(event) => {
              setRuc(onlyDigits(event.target.value))
              setRucError('')
            }}
            error={rucError}
          />
        )}
        <Button type="submit" className="w-full">
          Guardar cambios
        </Button>
      </form>
    </Card>
  )
}

function SecurityCard({ onNotice }) {
  return (
    <Card>
      <h2 className="mb-2 text-lg font-bold">Seguridad</h2>
      <p className="mb-4 text-sm text-slate-500">
        En esta demo no se modifica una contraseña real.
      </p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          onNotice('El cambio de contraseña requiere conectar una API.')
        }}
      >
        <Field label="Contraseña actual" type="password" placeholder="••••••••••••" />
        <Field label="Nueva contraseña" type="password" placeholder="Mínimo 8 caracteres" />
        <Field
          label="Confirmar nueva contraseña"
          type="password"
          placeholder="Repite la nueva contraseña"
        />
        <Button type="submit" className="w-full">
          Actualizar contraseña
        </Button>
      </form>
    </Card>
  )
}

function PreferencesCard({ preferences, onChange }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">Preferencias</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Moneda"
          value={preferences.currency}
          onChange={(event) => onChange({ currency: event.target.value })}
          options={CURRENCY_OPTIONS}
        />
        <SelectField
          label="Idioma"
          value={preferences.language}
          onChange={(event) => onChange({ language: event.target.value })}
          options={toOptions(['Español', 'English'])}
        />
        <SelectField
          className="sm:col-span-2"
          label="Formato de fecha"
          value={preferences.dateFormat}
          onChange={(event) => onChange({ dateFormat: event.target.value })}
          options={toOptions(['dd/mm/aaaa', 'mm/dd/aaaa', 'aaaa-mm-dd'])}
        />
      </div>
    </Card>
  )
}

function NotificationsCard({ preferences, onChange }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">Notificaciones y alertas</h2>
      <div className="space-y-4">
        {NOTIFICATION_TOGGLES.map(({ key, title, description }) => (
          <label key={key} className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-slate-500">{description}</span>
            </span>
            <input
              type="checkbox"
              checked={preferences[key]}
              onChange={(event) => onChange({ [key]: event.target.checked })}
              className="h-5 w-5 accent-[#203c91]"
            />
          </label>
        ))}
      </div>
    </Card>
  )
}

export function SettingsPage({ session, onLogout }) {
  const { data, profile, updatePreferences, loadDemoData, clearData } = useFinance()
  const [notice, setNotice] = useState('')

  function handleLoadDemo() {
    if (window.confirm('Esto reemplazará tus datos actuales por datos de ejemplo. ¿Continuar?')) {
      loadDemoData()
      setNotice('Se cargaron los datos de ejemplo.')
    }
  }

  function handleClear() {
    if (window.confirm('¿Borrar todos tus datos financieros de este navegador?')) {
      clearData()
      setNotice('Tus datos se borraron: la cuenta quedó vacía.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Configuración"
        subtitle="Administra tu perfil, tu seguridad y tus preferencias"
      />
      {notice && <Notice tone="success">{notice}</Notice>}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <ProfileCard session={session} profile={profile} onNotice={setNotice} />
          <SecurityCard onNotice={setNotice} />
        </div>
        <div className="space-y-5">
          <PreferencesCard preferences={data.preferences} onChange={updatePreferences} />
          <NotificationsCard preferences={data.preferences} onChange={updatePreferences} />
          <Card className="bg-rose-50">
            <h2 className="text-lg font-bold">Sesión y cuenta</h2>
            <p className="mt-2 text-sm text-slate-600">
              Cierra sesión en este equipo, carga datos de ejemplo para explorar la app o
              borra todos tus datos para empezar de cero.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={onLogout}>
                Cerrar sesión
              </Button>
              <Button variant="secondary" onClick={handleLoadDemo}>
                Cargar datos de ejemplo
              </Button>
              <Button variant="danger" onClick={handleClear}>
                Borrar mis datos
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mas opciones (solo movil)
// ---------------------------------------------------------------------------
export function MorePage({ session, onLogout }) {
  const { profile, setProfile } = useFinance()
  // Alterna entre los dos perfiles disponibles.
  const otherProfile = PROFILES.find((option) => option !== profile)

  return (
    <div className="space-y-5">
      <PageHeading title="Más opciones" subtitle={session?.name || session?.email || 'Tu cuenta'} />
      <Card>
        <button
          type="button"
          onClick={() => setProfile(otherProfile)}
          className="mb-3 flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left"
        >
          <span className="font-semibold">Perfil: {PROFILE_LABELS[profile]}</span>
          <span className="text-[#203c91]">Cambiar⌄</span>
        </button>
        <div className="divide-y divide-slate-100">
          {MORE_ITEMS.map(({ label, to, description }) => (
            <Link key={to} to={to} className="flex items-center justify-between gap-3 py-4">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-[#3154bb]">
                  •
                </span>
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs text-slate-500">{description}</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          ))}
        </div>
      </Card>
      <Button variant="secondary" className="w-full" onClick={onLogout}>
        Cerrar sesión
      </Button>
    </div>
  )
}

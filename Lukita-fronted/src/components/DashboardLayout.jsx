// Estructura visual del dashboard: menu lateral, cabecera y navegacion movil.
import { useState } from 'react'
import { LogOut, Menu, Plus, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useFinance } from '../lib/financeStore'
import {
  PROFILES,
  PROFILE_LABELS,
  getReferenceMonth,
  inMonth,
  summarize,
} from '../lib/financeUtils'
import {
  MOBILE_TABS,
  MORE_PATH,
  NAV_ITEMS,
  isRouteActive,
  routeTitle,
} from '../lib/navigation'

const NEW_TRANSACTION_PATH = '/app/transacciones?nuevo=1'

// Porcentaje del ingreso del mes que no se gasto (0 a 100).
function getHealthScore(transactions, month) {
  const { income, expenses } = summarize(inMonth(transactions, month))
  if (income <= 0) return 0
  return Math.max(0, Math.min(100, Math.round(((income - expenses) / income) * 100)))
}

function healthMessage(score) {
  if (score >= 60) return '¡Vas muy bien este mes!'
  if (score >= 30) return 'Vas bien, cuida tus gastos.'
  return 'Revisa tus gastos de este mes.'
}

function getInitials(name) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function Sidebar({ open, onClose, onLogout, healthScore }) {
  const { pathname } = useLocation()

  return (
    <aside
      className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-gradient-to-b from-[#172c69] to-[#2949a5] px-4 py-5 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="dashboard-brand mb-8 flex items-center gap-3 px-1">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-xl font-extrabold">
          L
        </span>
        <span className="text-2xl font-bold tracking-tight">Lukita</span>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="ml-auto rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav
        aria-label="Navegación principal"
        className="dashboard-nav-scroll space-y-1 overflow-y-auto"
      >
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
          const selected = isRouteActive(to, pathname)
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              aria-current={selected ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                selected
                  ? 'bg-white/20 font-semibold text-white'
                  : 'text-white/85 hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      <section className="dashboard-health-card mt-auto rounded-2xl bg-white/15 p-4">
        <p className="text-xs font-medium text-blue-100">Salud financiera</p>
        <p className="health-percent mt-1 text-3xl font-bold">{healthScore}%</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${healthScore}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-blue-100">{healthMessage(healthScore)}</p>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="dashboard-logout mt-3 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/80 hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </aside>
  )
}

function ProfileSwitcher() {
  const { profile, setProfile } = useFinance()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Perfil: {PROFILE_LABELS[profile]}
        <span className="text-slate-400">⌄</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl">
          {PROFILES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setProfile(option)
                setOpen(false)
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              {PROFILE_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Topbar({ displayName, onOpenMenu, onNewTransaction, onLogout }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = routeTitle(pathname)
  const isHome = title === 'Dashboard'

  return (
    <header className="flex items-center justify-between gap-3 px-4 pb-4 pt-5 sm:px-7 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={onOpenMenu}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
            {isHome ? 'Hola, bienvenido de nuevo' : title}
          </p>
          <p className="truncate text-xs text-slate-500">
            {isHome
              ? 'Resumen de tus finanzas'
              : 'Organiza tus finanzas personales y empresariales'}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ProfileSwitcher />
        {pathname !== MORE_PATH && (
          <button
            type="button"
            onClick={onNewTransaction}
            className="flex items-center gap-2 rounded-xl bg-[#203c91] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#172f7c] sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva transacción</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        )}
        <button
          type="button"
          aria-label={`Perfil de ${displayName}`}
          onClick={() => navigate('/app/configuracion')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-[#203c91]"
        >
          {getInitials(displayName) || 'LU'}
        </button>
        {/* Visible en todas las pantallas y tamaños, sin abrir el menu. */}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden md:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  )
}

function MobileTab({ label, to, icon: Icon }) {
  const { pathname } = useLocation()
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 py-1 text-[10px] ${
        isRouteActive(to, pathname) ? 'font-semibold text-[#203c91]' : 'text-slate-500'
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}

function MobileNav({ moreOpen, onToggleMore, onNewTransaction }) {
  const { pathname } = useLocation()
  const moreActive = pathname === MORE_PATH || moreOpen

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_24px_-20px_rgba(15,23,42,.4)] lg:hidden"
    >
      {MOBILE_TABS.left.map((tab) => (
        <MobileTab key={tab.to} {...tab} />
      ))}
      <button
        type="button"
        onClick={onNewTransaction}
        aria-label="Nueva transacción"
        className="-mt-5 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#203c91] text-white shadow-lg"
      >
        <Plus className="h-7 w-7" />
      </button>
      <MobileTab {...MOBILE_TABS.right} />
      <button
        type="button"
        onClick={onToggleMore}
        className={`flex flex-col items-center gap-1 py-1 text-[10px] ${
          moreActive ? 'font-semibold text-[#203c91]' : 'text-slate-500'
        }`}
      >
        <Menu className="h-5 w-5" />
        Más
      </button>
    </nav>
  )
}

// Menu movil con las secciones que no caben en la barra inferior.
function MoreMenu({ onClose }) {
  return (
    <div className="fixed inset-x-3 bottom-20 z-30 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl lg:hidden">
      {NAV_ITEMS.slice(3).map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-medium text-slate-700"
        >
          <Icon className="h-4 w-4 text-[#203c91]" />
          {label}
        </Link>
      ))}
    </div>
  )
}

function DashboardLayout({ session, onLogout, children }) {
  const navigate = useNavigate()
  const { data, profile } = useFinance()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const month = getReferenceMonth(data.transactions)
  const displayName = session?.name?.trim() || session?.email || 'Usuario'

  function startTransaction() {
    navigate(NEW_TRANSACTION_PATH)
    setMenuOpen(false)
    setMoreOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-slate-900 lg:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
        />
      )}
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={onLogout}
        healthScore={getHealthScore(data.transactions, month)}
      />

      <div className="min-w-0 flex-1">
        <Topbar
          displayName={displayName}
          onOpenMenu={() => setMenuOpen(true)}
          onNewTransaction={startTransaction}
          onLogout={onLogout}
        />
        <div className="px-4 pb-28 sm:px-7 lg:px-8 lg:pb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
            <span>
              Modo demostración: los cambios se guardan en este navegador; no se
              conectan a una API.
            </span>
            <span className="hidden font-semibold sm:inline">
              Perfil {PROFILE_LABELS[profile].toLowerCase()}
            </span>
          </div>
          {children}
        </div>
      </div>

      <MobileNav
        moreOpen={moreOpen}
        onToggleMore={() => {
          setMoreOpen((open) => !open)
          setMenuOpen(false)
        }}
        onNewTransaction={startTransaction}
      />
      {moreOpen && <MoreMenu onClose={() => setMoreOpen(false)} />}
    </div>
  )
}

export default DashboardLayout

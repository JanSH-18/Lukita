// Shell protegido del dashboard: navegacion, perfil activo y rutas de cada modulo.
import { useState } from 'react'
import {
  ArrowLeftRight,
  BarChart3,
  ChartPie,
  CircleDollarSign,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Plus,
  Repeat2,
  Settings,
  Tags,
  Target,
  Wallet,
  X,
} from 'lucide-react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { FinanceProvider, useFinance } from '../lib/financeStore'
import {
  AccountsPage,
  BudgetsPage,
  CategoriesPage,
  ExtraExpensesPage,
  GoalsPage,
  MoneyPage,
  MorePage,
  RecurringPage,
  ReportsPage,
  SettingsPage,
  TransactionsPage,
} from './finance'
import DashboardHome from './dashboardHome'

// Fuente unica para la navegacion de escritorio y el menu movil.
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/app', icon: Home },
  { label: 'Mi dinero', to: '/app/mi-dinero', icon: Wallet },
  { label: 'Transacciones', to: '/app/transacciones', icon: ArrowLeftRight },
  { label: 'Gastos extras', to: '/app/gastos-extras', icon: CircleDollarSign },
  { label: 'Categorías', to: '/app/categorias', icon: Tags },
  { label: 'Presupuestos', to: '/app/presupuestos', icon: ChartPie },
  { label: 'Metas de ahorro', to: '/app/metas-de-ahorro', icon: Target },
  { label: 'Recurrentes', to: '/app/recurrentes', icon: Repeat2 },
  { label: 'Cuentas', to: '/app/cuentas', icon: CreditCard },
  { label: 'Reportes', to: '/app/reportes', icon: BarChart3 },
  { label: 'Configuración', to: '/app/configuracion', icon: Settings },
]

function routeTitle(pathname) {
  return NAV_ITEMS.find((item) => item.to !== '/app' && pathname.startsWith(item.to))?.label
    ?? (pathname === '/app/mas' ? 'Más opciones' : 'Dashboard')
}

function DashboardLayout({ session, onLogout, children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile, setProfile } = useFinance()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const displayName = session?.name?.trim() || session?.email || 'Usuario'
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
  const active = routeTitle(pathname)
  // En movil se muestran las rutas de uso frecuente y el resto queda en "Mas".
  const mobileTabs = [
    { label: 'Inicio', to: '/app', icon: Home },
    { label: 'Movimientos', to: '/app/transacciones', icon: ArrowLeftRight },
    { label: 'Presupuestos', to: '/app/presupuestos', icon: ChartPie },
  ]

  function startTransaction() {
    navigate('/app/transacciones?nuevo=1')
    setMenuOpen(false)
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
      <aside className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-gradient-to-b from-[#172c69] to-[#2949a5] px-4 py-5 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:translate-x-0 ${
        menuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="dashboard-brand mb-8 flex items-center gap-3 px-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-xl font-extrabold">L</span>
          <span className="text-2xl font-bold tracking-tight">Lukita</span>
          <button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="ml-auto rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Navegación principal" className="dashboard-nav-scroll space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
            const selected = to === '/app' ? pathname === '/app' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                aria-current={selected ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  selected ? 'bg-white/20 font-semibold text-white' : 'text-white/85 hover:bg-white/10'
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
          <p className="health-percent mt-1 text-3xl font-bold">82%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-[82%] rounded-full bg-amber-400" />
          </div>
          <p className="mt-2 text-xs text-blue-100">¡Vas muy bien este mes!</p>
        </section>
        <button type="button" onClick={onLogout} className="dashboard-logout mt-3 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/80 hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 px-4 pb-4 pt-5 sm:px-7 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Abrir menú" onClick={() => setMenuOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 sm:text-base">{active === 'Dashboard' ? 'Hola, bienvenido de nuevo' : active}</p>
              <p className="truncate text-xs text-slate-500">{active === 'Dashboard' ? 'Resumen de tus finanzas · Octubre 2026' : 'Organiza tus finanzas personales y empresariales'}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setProfileMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Perfil: {profile === 'personal' ? 'Personal' : 'Empresarial'}
                <span className="text-slate-400">⌄</span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl">
                  {['personal', 'empresarial'].map((option) => (
                    <button key={option} type="button" onClick={() => { setProfile(option); setProfileMenuOpen(false) }} className="w-full rounded-lg px-3 py-2 text-left text-sm capitalize hover:bg-slate-100">
                      {option === 'personal' ? 'Personal' : 'Empresarial'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {active !== 'Más opciones' && (
              <button type="button" onClick={startTransaction} className="flex items-center gap-2 rounded-xl bg-[#203c91] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#172f7c] sm:px-4 sm:text-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva transacción</span>
                <span className="sm:hidden">Nueva</span>
              </button>
            )}
            <button type="button" aria-label={`Perfil de ${displayName}`} onClick={() => navigate('/app/configuracion')} className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-[#203c91]">
              {initials || 'LU'}
            </button>
          </div>
        </header>

        <div className="px-4 pb-28 sm:px-7 lg:px-8 lg:pb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
            <span>Modo demostración: los cambios se guardan en este navegador; no se conectan a una API.</span>
            <span className="hidden font-semibold sm:inline">Perfil {profile === 'personal' ? 'personal' : 'empresarial'}</span>
          </div>
          {children}
        </div>
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_24px_-20px_rgba(15,23,42,.4)] lg:hidden">
        {mobileTabs.slice(0, 2).map(({ label, to, icon: Icon }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-1 py-1 text-[10px] ${pathname === to ? 'font-semibold text-[#203c91]' : 'text-slate-500'}`}>
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
        <button type="button" onClick={startTransaction} aria-label="Nueva transacción" className="-mt-5 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#203c91] text-white shadow-lg">
          <Plus className="h-7 w-7" />
        </button>
        <Link to="/app/presupuestos" className={`flex flex-col items-center gap-1 py-1 text-[10px] ${pathname.startsWith('/app/presupuestos') ? 'font-semibold text-[#203c91]' : 'text-slate-500'}`}>
          <ChartPie className="h-5 w-5" />Presupuestos
        </Link>
        <button type="button" onClick={() => { setMobileMoreOpen((open) => !open); setMenuOpen(false) }} className={`flex flex-col items-center gap-1 py-1 text-[10px] ${pathname === '/app/mas' || mobileMoreOpen ? 'font-semibold text-[#203c91]' : 'text-slate-500'}`}>
          <Menu className="h-5 w-5" />Más
        </button>
      </nav>
      {mobileMoreOpen && (
        <div className="fixed inset-x-3 bottom-20 z-30 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl lg:hidden">
          {NAV_ITEMS.slice(3).map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMobileMoreOpen(false)} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-medium text-slate-700">
              <Icon className="h-4 w-4 text-[#203c91]" />{label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function DashboardRoutes({ session, onLogout }) {
  return (
    <FinanceProvider>
      <DashboardLayout session={session} onLogout={onLogout}>
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="mi-dinero" element={<MoneyPage />} />
          <Route path="transacciones" element={<TransactionsPage />} />
          <Route path="gastos-extras" element={<ExtraExpensesPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="presupuestos" element={<BudgetsPage />} />
          <Route path="metas-de-ahorro" element={<GoalsPage />} />
          <Route path="recurrentes" element={<RecurringPage />} />
          <Route path="cuentas" element={<AccountsPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="configuracion" element={<SettingsPage session={session} onLogout={onLogout} />} />
          <Route path="mas" element={<MorePage session={session} onLogout={onLogout} />} />
        </Routes>
      </DashboardLayout>
    </FinanceProvider>
  )
}

export default DashboardRoutes

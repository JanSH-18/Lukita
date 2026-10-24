import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  LogOut,
  Menu,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/app' },
  { label: 'Mi dinero', to: '/app/mi-dinero' },
  { label: 'Transacciones', to: '/app/transacciones' },
  { label: 'Gastos extras', to: '/app/gastos-extras' },
  { label: 'Categorías', to: '/app/categorias' },
  { label: 'Presupuestos', to: '/app/presupuestos' },
  { label: 'Metas de ahorro', to: '/app/metas-de-ahorro' },
  { label: 'Recurrentes', to: '/app/recurrentes' },
  { label: 'Cuentas', to: '/app/cuentas' },
  { label: 'Reportes', to: '/app/reportes' },
  { label: 'Configuración', to: '/app/configuracion' },
]

const MONTHS = [
  { month: 'May', income: 68, expenses: 43 },
  { month: 'Jun', income: 62, expenses: 54 },
  { month: 'Jul', income: 78, expenses: 50 },
  { month: 'Ago', income: 75, expenses: 60 },
  { month: 'Sep', income: 83, expenses: 46 },
  { month: 'Oct', income: 90, expenses: 52 },
]

const INITIAL_TRANSACTIONS = [
  {
    id: 1,
    description: 'Pago de sueldo',
    category: 'Ingresos',
    date: '14 oct',
    amount: 3200,
    type: 'income',
  },
  {
    id: 2,
    description: 'Alquiler de departamento',
    category: 'Vivienda',
    date: '12 oct',
    amount: -900,
    type: 'expense',
  },
  {
    id: 3,
    description: 'Supermercado',
    category: 'Alimentación',
    date: '11 oct',
    amount: -85.4,
    type: 'expense',
  },
  {
    id: 4,
    description: 'Recarga de transporte',
    category: 'Transporte',
    date: '10 oct',
    amount: -25,
    type: 'expense',
  },
  {
    id: 5,
    description: 'Venta freelance',
    category: 'Ingresos',
    date: '09 oct',
    amount: 450,
    type: 'income',
  },
]

const GOALS = [
  {
    name: 'Viaje de vacaciones',
    amount: '$2,040 de $3,000',
    progress: 68,
    color: 'bg-amber-500',
    surface: 'bg-amber-100',
  },
  {
    name: 'Fondo de emergencia',
    amount: '$4,500 de $10,000',
    progress: 45,
    color: 'bg-blue-700',
    surface: 'bg-indigo-100',
  },
  {
    name: 'Laptop nueva',
    amount: '$720 de $1,200',
    progress: 60,
    color: 'bg-emerald-500',
    surface: 'bg-emerald-100',
  },
]

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const ICONS = {
  menu: Menu,
  search: Search,
  plus: Plus,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  star: Star,
  chevron: ChevronRight,
  close: X,
  logout: LogOut,
}

function Icon({ name, className = 'h-4 w-4' }) {
  const LucideIcon = ICONS[name]

  if (!LucideIcon) return null

  return (
    <LucideIcon
      className={className}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  )
}

function MetricCard({ label, value, detail, tone, icon }) {
  const tones = {
    income: 'bg-emerald-100 text-emerald-600',
    expense: 'bg-rose-100 text-rose-500',
    savings: 'bg-amber-100 text-amber-600',
  }

  return (
    <article className={`min-w-0 rounded-2xl p-4 shadow-sm sm:p-5 ${tone}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${tones[icon]}`}>
          <Icon name={icon === 'income' ? 'arrowUp' : icon === 'expense' ? 'arrowDown' : 'star'} className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-medium text-slate-500">{detail}</p>
    </article>
  )
}

function Dashboard({ session, onLogout }) {
  const { pathname } = useLocation()
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const activeNav =
    NAV_ITEMS.find((item) => item.to === pathname)?.label ?? 'Dashboard'
  const displayName = session?.name?.trim() || session?.email || 'usuario'
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return INITIAL_TRANSACTIONS
    return INITIAL_TRANSACTIONS.filter((transaction) =>
      `${transaction.description} ${transaction.category} ${transaction.date}`
        .toLowerCase()
        .includes(query),
    )
  }, [search])

  function handleNav(label) {
    if (label !== 'Dashboard') {
      setNotice(`${label}: esta sección estará disponible próximamente.`)
    } else {
      setNotice('')
    }
    setMenuOpen(false)
  }

  function handleNewTransaction() {
    setNotice('El registro de transacciones estará disponible próximamente.')
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-slate-900 lg:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[215px] flex-col bg-gradient-to-b from-[#172c69] to-[#2949a5] px-4 py-5 text-white transition-transform lg:static lg:w-[170px] lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-7 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffad12] text-sm font-extrabold text-white">
            L
          </span>
          <span className="text-lg font-bold tracking-tight">Lukita</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="ml-auto rounded-md p-1 text-white/80 hover:bg-white/10 lg:hidden"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => handleNav(item.label)}
              aria-current={activeNav === item.label ? 'page' : undefined}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] transition ${
                activeNav === item.label
                  ? 'bg-white/20 font-semibold text-white'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  activeNav === item.label ? 'bg-white' : 'bg-white/50'
                }`}
              />
              {item.label}
            </Link>
          ))}
        </nav>

        <article className="mt-auto rounded-xl bg-white/15 p-3">
          <p className="text-[10px] font-medium text-blue-100">Salud financiera</p>
          <p className="mt-1 text-2xl font-bold">82%</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-[82%] rounded-full bg-amber-400" />
          </div>
          <p className="mt-2 text-[9px] text-blue-100">¡Vas muy bien este mes!</p>
        </article>

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] text-white/80 hover:bg-white/10"
        >
          <Icon name="logout" className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
            >
              <Icon name="menu" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                Hola, bienvenido de nuevo
              </h1>
              <p className="text-[10px] text-slate-500 sm:text-xs">
                Resumen de tus finanzas · octubre 2026
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400 sm:flex">
              <Icon name="search" className="h-3.5 w-3.5" />
              <span className="sr-only">Buscar movimientos</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar movimientos..."
                className="w-28 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400 md:w-32"
              />
            </label>
            <button
              type="button"
              onClick={handleNewTransaction}
              className="flex items-center gap-1 rounded-lg bg-[#203c91] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#172f7c]"
            >
              <Icon name="plus" className="h-3 w-3" />
              <span className="hidden sm:inline">Nueva transacción</span>
              <span className="sm:hidden">Nueva</span>
            </button>
            <button
              type="button"
              title={displayName}
              aria-label={`Cuenta de ${displayName}`}
              onClick={() => setNotice(`Sesión iniciada como ${displayName}.`)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-[#203c91]"
            >
              {initials || 'LU'}
            </button>
          </div>
        </header>

        <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400 sm:hidden">
          <Icon name="search" className="h-3.5 w-3.5" />
          <span className="sr-only">Buscar movimientos</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar movimientos..."
            className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] text-blue-800">
          <span>Vista de demostración: los datos son ilustrativos y aún no se guardan.</span>
          {notice && <span role="status" className="font-semibold">{notice}</span>}
          {!notice && (
            <span className="hidden font-semibold sm:inline">Datos de ejemplo</span>
          )}
        </div>

        <section aria-label="Resumen mensual" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="relative min-h-[112px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c347f] to-[#3558bd] p-4 text-white shadow-sm sm:p-5">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 right-2 h-20 w-20 rounded-full bg-rose-200/30" />
            <p className="relative text-[10px] font-medium text-blue-100">Balance total</p>
            <p className="relative mt-2 text-2xl font-bold tracking-tight sm:text-[28px]">
              $24,580.00
            </p>
            <span className="relative mt-2 inline-flex rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-semibold">
              +12.5% vs. mes anterior
            </span>
          </article>
          <MetricCard
            label="Ingresos"
            value="$10,200.00"
            detail="+8.4% este mes"
            tone="bg-emerald-100/90"
            icon="income"
          />
          <MetricCard
            label="Gastos"
            value="$6,100.00"
            detail="+3.1% este mes"
            tone="bg-rose-100/90"
            icon="expense"
          />
          <MetricCard
            label="Ahorro"
            value="$4,100.00"
            detail="40% de tus ingresos"
            tone="bg-amber-100/90"
            icon="savings"
          />
        </section>

        <section className="mt-4 grid gap-3 xl:grid-cols-[1.85fr_1fr]">
          <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold sm:text-sm">Ingresos vs. gastos</h2>
                <p className="text-[10px] text-slate-500">Últimos 6 meses (en miles)</p>
              </div>
              <div className="flex gap-3 text-[9px] text-slate-500">
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />Ingresos</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-500" />Gastos</span>
              </div>
            </div>
            <div className="flex h-36 items-end justify-around gap-2 border-b border-slate-100 px-1 sm:h-40 sm:px-4">
              {MONTHS.map((item) => (
                <div key={item.month} className="flex h-full flex-1 items-end justify-center gap-1.5">
                  <div
                    title={`${item.month}: ingresos`}
                    className="w-3 rounded-t-md bg-emerald-500 sm:w-4"
                    style={{ height: `${item.income}%` }}
                  />
                  <div
                    title={`${item.month}: gastos`}
                    className="w-3 rounded-t-md bg-red-500 sm:w-4"
                    style={{ height: `${item.expenses}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-around px-1 pt-2 text-[9px] text-slate-500 sm:px-4">
              {MONTHS.map((item) => <span key={item.month}>{item.month}</span>)}
            </div>
          </article>

          <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-xs font-bold sm:text-sm">Gastos por categoría</h2>
            <div className="flex items-center justify-center py-2">
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full sm:h-32 sm:w-32"
                style={{
                  background:
                    'conic-gradient(#3154bb 0% 35%, #f59e0b 35% 63%, #ef4444 63% 83%, #10b981 83% 100%)',
                }}
                role="img"
                aria-label="Gráfico circular: vivienda 35%, alimentación 28%, transporte 20%, ocio 17%"
              >
                <div className="flex h-[68%] w-[68%] flex-col items-center justify-center rounded-full bg-white">
                  <strong className="text-sm">$6,100</strong>
                  <span className="text-[9px] text-slate-500">Total</span>
                </div>
              </div>
            </div>
            <ul className="space-y-1.5">
              {[
                ['Vivienda', '35%', 'bg-blue-700'],
                ['Alimentación', '28%', 'bg-amber-500'],
                ['Transporte', '20%', 'bg-red-500'],
                ['Ocio', '17%', 'bg-emerald-500'],
              ].map(([category, percentage, color]) => (
                <li key={category} className="flex items-center justify-between text-[9px]">
                  <span className="flex items-center gap-1.5"><i className={`h-1.5 w-1.5 rounded-full ${color}`} />{category}</span>
                  <strong>{percentage}</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-4 grid gap-3 xl:grid-cols-[1.85fr_1fr]">
          <article className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold sm:text-sm">Últimas transacciones</h2>
              <Link
                to="/app/transacciones"
                onClick={() => handleNav('Transacciones')}
                className="flex items-center gap-1 text-[9px] font-semibold text-[#203c91] hover:underline"
              >
                Ver todas <Icon name="chevron" className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_70px] gap-2 border-b border-slate-100 pb-2 text-[8px] font-medium uppercase tracking-wide text-slate-500 sm:grid-cols-[minmax(120px,1.5fr)_minmax(80px,1fr)_48px_68px]">
              <span>Descripción</span>
              <span className="hidden sm:block">Categoría</span>
              <span className="hidden sm:block">Fecha</span>
              <span className="text-right">Monto</span>
            </div>
            <div>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-[minmax(0,1fr)_70px] items-center gap-2 border-b border-slate-100 py-2.5 text-[9px] last:border-b-0 sm:grid-cols-[minmax(120px,1.5fr)_minmax(80px,1fr)_48px_68px] sm:text-[10px]"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        transaction.type === 'income'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        <Icon name={transaction.type === 'income' ? 'arrowUp' : 'arrowDown'} className="h-3 w-3" />
                      </span>
                      <span className="truncate">{transaction.description}</span>
                    </span>
                    <span className="hidden sm:inline">
                      <span className={`rounded-full px-2 py-1 text-[8px] font-medium ${
                        transaction.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {transaction.category}
                      </span>
                    </span>
                    <span className="hidden text-slate-500 sm:inline">{transaction.date}</span>
                    <strong className={`text-right ${
                      transaction.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {transaction.amount > 0 ? '+' : '-'}
                      {currency.format(Math.abs(transaction.amount))}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">
                  No hay movimientos que coincidan con “{search}”.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-xs font-bold sm:text-sm">Metas de ahorro</h2>
            <div className="space-y-2.5">
              {GOALS.map((goal) => (
                <div key={goal.name} className={`rounded-xl p-3 ${goal.surface}`}>
                  <div className="flex items-center justify-between gap-2 text-[9px]">
                    <span className="font-semibold">{goal.name}</span>
                    <strong className={goal.color.replace('bg-', 'text-')}>
                      {goal.progress}%
                    </strong>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/90">
                    <div
                      className={`h-full rounded-full ${goal.color}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[8px] text-slate-500">{goal.amount}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard

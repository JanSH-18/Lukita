// Resumen principal: metricas y graficos calculados con los datos del perfil activo.
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Star } from 'lucide-react'
import { Card, EmptyState } from '../components/FinanceUI'
import { useFinance } from '../lib/financeStore'
import {
  formatDate,
  formatMonth,
  formatShortMonth,
  getAccountBalance,
  getCategoryName,
  getReferenceMonth,
  inMonth,
  lastMonths,
  spentInCategory,
  summarize,
} from '../lib/financeUtils'

const NEW_TRANSACTION_PATH = '/app/transacciones?nuevo=1'
const CHART_MONTHS = 6
const CATEGORY_COLORS = ['#3154bb', '#f59e0b', '#ef4444', '#10b981']
const OTHERS_COLOR = '#94a3b8'

const GOAL_BARS = ['bg-amber-500', 'bg-blue-700', 'bg-emerald-500']
const GOAL_BACKGROUNDS = ['bg-amber-100', 'bg-indigo-100', 'bg-emerald-100']

// Gastos del mes agrupados por categoria: las 4 mayores y el resto como "Otras".
function getCategorySegments(data, monthTransactions, totalExpenses) {
  const sorted = data.categories
    .filter((category) => category.type === 'expense')
    .map((category) => ({
      id: category.id,
      name: category.name,
      total: spentInCategory(monthTransactions, category.id),
    }))
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)

  const segments = sorted.slice(0, CATEGORY_COLORS.length).map((category, index) => ({
    ...category,
    color: CATEGORY_COLORS[index],
  }))
  const others = totalExpenses - segments.reduce((sum, item) => sum + item.total, 0)
  if (others > 0.005) {
    segments.push({ id: 'others', name: 'Otras', total: others, color: OTHERS_COLOR })
  }
  return segments
}

function toConicGradient(segments, total) {
  if (!segments.length) return 'conic-gradient(#e2e8f0 0% 100%)'
  let accumulated = 0
  const stops = segments.map((segment) => {
    const start = accumulated
    accumulated += (segment.total / total) * 100
    return `${segment.color} ${start}% ${accumulated}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}

// ---------------------------------------------------------------------------
// Tarjetas de resumen
// ---------------------------------------------------------------------------
const METRIC_STYLES = {
  income: { icon: ArrowUpRight, badge: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-600' },
  expense: { icon: ArrowDownRight, badge: 'bg-rose-100 text-rose-500', value: 'text-red-500' },
  savings: { icon: Star, badge: 'bg-amber-100 text-amber-600', value: 'text-slate-900' },
}

function Metric({ label, amount, kind }) {
  const { money } = useFinance()
  const { icon: Icon, badge, value } = METRIC_STYLES[kind]

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${badge}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${value}`}>{money(amount)}</p>
    </article>
  )
}

function BalanceCard({ amount, hasMovements }) {
  const { money } = useFinance()

  return (
    <article className="relative min-h-36 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1c347f] to-[#3558bd] p-5 text-white shadow-sm sm:col-span-2 xl:col-span-1">
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 right-2 h-24 w-24 rounded-full bg-rose-200/30" />
      <p className="relative text-sm font-medium text-blue-100">Balance total</p>
      <p className="relative mt-2 text-3xl font-bold tracking-tight">{money(amount)}</p>
      <span className="relative mt-3 inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold">
        {hasMovements ? 'Suma de todas tus cuentas' : 'Aún sin movimientos'}
      </span>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Graficos
// ---------------------------------------------------------------------------
function MonthlyChart({ transactions, month }) {
  const months = lastMonths(month, CHART_MONTHS).map((key) => ({
    key,
    label: formatShortMonth(key),
    ...summarize(inMonth(transactions, key)),
  }))
  const highest = Math.max(1, ...months.flatMap((item) => [item.income, item.expenses]))
  const barHeight = (amount) => `${(amount / highest) * 100}%`

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Ingresos vs. gastos</h2>
          <p className="text-xs text-slate-500">Últimos {CHART_MONTHS} meses</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-emerald-500" />
            Ingresos
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-red-500" />
            Gastos
          </span>
        </div>
      </div>

      {transactions.length ? (
        <>
          <div className="flex h-44 items-end justify-around gap-2 border-b border-slate-100 px-2">
            {months.map((item) => (
              <div key={item.key} className="flex h-full flex-1 items-end justify-center gap-1.5">
                <div
                  className="w-3 rounded-t-md bg-emerald-500 sm:w-5"
                  style={{ height: barHeight(item.income) }}
                  title={`${item.label}: ingresos`}
                />
                <div
                  className="w-3 rounded-t-md bg-red-500 sm:w-5"
                  style={{ height: barHeight(item.expenses) }}
                  title={`${item.label}: gastos`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-around px-2 pt-2 text-xs text-slate-500">
            {months.map((item) => (
              <span key={item.key}>{item.label}</span>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Aún no tienes datos para mostrar"
          description="Registra tu primer ingreso o gasto y aquí verás la comparación mes a mes."
          action={
            <Link className="text-sm font-bold text-[#203c91]" to={NEW_TRANSACTION_PATH}>
              Registrar mi primer movimiento
            </Link>
          }
        />
      )}
    </Card>
  )
}

function CategoryChart({ data, monthTransactions, expenses }) {
  const { money } = useFinance()
  const segments = getCategorySegments(data, monthTransactions, expenses)

  return (
    <Card>
      <h2 className="text-lg font-bold">Gastos por categoría</h2>
      {expenses > 0 ? (
        <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(120px,160px)_1fr]">
          <div
            className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full"
            style={{ background: toConicGradient(segments, expenses) }}
            role="img"
            aria-label="Gráfico de gastos por categoría"
          >
            <div className="flex h-[68%] w-[68%] flex-col items-center justify-center rounded-full bg-white">
              <strong className="text-sm">{money(expenses)}</strong>
              <span className="text-[10px] text-slate-500">Gastos</span>
            </div>
          </div>
          <ul className="space-y-2">
            {segments.map((segment) => (
              <li key={segment.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <i
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="truncate">{segment.name}</span>
                </span>
                <strong>{Math.round((segment.total / expenses) * 100)}%</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Sin gastos todavía"
            description="Cuando registres gastos, verás las categorías aquí."
          />
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Listas
// ---------------------------------------------------------------------------
function RecentTransactions({ data }) {
  const { money } = useFinance()

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Últimas transacciones</h2>
        <Link
          to="/app/transacciones"
          className="text-xs font-semibold text-[#203c91] hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      {data.transactions.length ? (
        <div className="divide-y divide-slate-100">
          {data.transactions.slice(0, 5).map((transaction) => {
            const isIncome = transaction.type === 'income'
            const Icon = isIncome ? ArrowUpRight : ArrowDownRight
            return (
              <div key={transaction.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{transaction.description}</p>
                  <p className="text-xs text-slate-500">
                    {getCategoryName(data, transaction.categoryId)} · {formatDate(transaction.date)}
                  </p>
                </div>
                <strong
                  className={`shrink-0 text-sm ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {isIncome ? '+' : '-'}
                  {money(transaction.amount)}
                </strong>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No hay movimientos"
          description="Empieza registrando un ingreso o un gasto."
          action={
            <Link to={NEW_TRANSACTION_PATH} className="font-semibold text-[#203c91]">
              Crear movimiento
            </Link>
          }
        />
      )}
    </Card>
  )
}

function GoalsSummary({ goals }) {
  const { money } = useFinance()

  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">Metas de ahorro</h2>
      <div className="space-y-3">
        {goals.slice(0, 3).map((goal, index) => {
          const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100))
          return (
            <div
              key={goal.id}
              className={`rounded-xl p-3 ${GOAL_BACKGROUNDS[index % GOAL_BACKGROUNDS.length]}`}
            >
              <div className="flex justify-between gap-2 text-xs">
                <span className="font-semibold">{goal.name}</span>
                <strong>{progress}%</strong>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${GOAL_BARS[index % GOAL_BARS.length]}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {money(goal.saved)} de {money(goal.target)}
              </p>
            </div>
          )
        })}
        {!goals.length && (
          <EmptyState title="Crea tu primera meta" description="Define objetivos y sigue tu progreso." />
        )}
      </div>
      <Link
        to="/app/metas-de-ahorro"
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#203c91]"
      >
        <Star className="h-3.5 w-3.5" /> Ver metas
      </Link>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------
function DashboardHome() {
  const { data } = useFinance()
  const month = getReferenceMonth(data.transactions)
  const monthTransactions = inMonth(data.transactions, month)
  const { income, expenses, balance: savings } = summarize(monthTransactions)
  const totalBalance = data.accounts.reduce(
    (sum, account) => sum + getAccountBalance(account, data.transactions),
    0,
  )

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceCard amount={totalBalance} hasMovements={data.transactions.length > 0} />
        <Metric label={`Ingresos · ${formatMonth(month)}`} amount={income} kind="income" />
        <Metric label={`Gastos · ${formatMonth(month)}`} amount={expenses} kind="expense" />
        <Metric label="Ahorro del mes" amount={savings} kind="savings" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <MonthlyChart transactions={data.transactions} month={month} />
        <CategoryChart data={data} monthTransactions={monthTransactions} expenses={expenses} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <RecentTransactions data={data} />
        <GoalsSummary goals={data.goals} />
      </section>

      <p className="pb-2 text-center text-[10px] text-slate-400">
        Los datos son de demostración y se guardan localmente.
      </p>
    </div>
  )
}

export default DashboardHome

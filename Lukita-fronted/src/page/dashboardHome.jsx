// Resumen principal: deriva metricas y graficos de los datos del perfil activo.
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Plus, Star } from 'lucide-react'
import { Card, EmptyState } from '../components/FinanceUI'
import { useFinance } from '../lib/financeStore'
import { formatCurrency, formatDate, getCategoryName } from '../lib/financeUtils'

// Comparacion ilustrativa para el grafico mensual de esta version demo.
const MONTHS = [
  { month: 'May', income: 68, expenses: 43 },
  { month: 'Jun', income: 62, expenses: 54 },
  { month: 'Jul', income: 78, expenses: 50 },
  { month: 'Ago', income: 75, expenses: 60 },
  { month: 'Sep', income: 83, expenses: 46 },
  { month: 'Oct', income: 90, expenses: 52 },
]

function DashboardHome() {
  const { data } = useFinance()
  // Las metricas actuales se calculan a partir de las transacciones guardadas.
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expenses = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const balance = income - expenses
  const categories = data.categories
    .filter((category) => category.type === 'expense')
    .map((category) => ({
      ...category,
      total: data.transactions
        .filter((item) => item.type === 'expense' && item.categoryId === category.id)
        .reduce((sum, item) => sum + item.amount, 0),
    }))
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)
  const topCategories = categories.slice(0, 4)
  const palette = ['#3154bb', '#f59e0b', '#ef4444', '#10b981', '#6366f1']
  let accumulated = 0
  const conic = topCategories.length
    ? `conic-gradient(${topCategories.map((category, index) => {
        const start = accumulated
        const proportion = category.total / expenses * 100
        accumulated += proportion
        return `${palette[index % palette.length]} ${start}% ${accumulated}%`
      }).join(', ')})`
    : 'conic-gradient(#e2e8f0 0% 100%)'

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="relative min-h-36 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1c347f] to-[#3558bd] p-5 text-white shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-2 h-24 w-24 rounded-full bg-rose-200/30" />
          <p className="relative text-sm font-medium text-blue-100">Balance total</p>
          <p className="relative mt-2 text-3xl font-bold tracking-tight">{formatCurrency(balance)}</p>
          <span className="relative mt-3 inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold">
            {income ? 'Resumen de tus movimientos' : 'Aún sin movimientos'}
          </span>
        </article>
        <Metric label="Ingresos del mes" value={income} icon="income" />
        <Metric label="Gastos del mes" value={expenses} icon="expense" />
        <Metric label="Ahorro" value={balance} icon="savings" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Ingresos vs. gastos</h2>
              <p className="text-xs text-slate-500">Últimos 6 meses (en miles)</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />Ingresos</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-500" />Gastos</span>
            </div>
          </div>
          {data.transactions.length ? (
            <div className="flex h-44 items-end justify-around gap-2 border-b border-slate-100 px-2">
              {MONTHS.map((item) => (
                <div key={item.month} className="flex h-full flex-1 items-end justify-center gap-1.5">
                  <div className="w-3 rounded-t-md bg-emerald-500 sm:w-5" style={{ height: `${item.income}%` }} title={`${item.month} ingresos`} />
                  <div className="w-3 rounded-t-md bg-red-500 sm:w-5" style={{ height: `${item.expenses}%` }} title={`${item.month} gastos`} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aún no tienes datos para mostrar" description="Registra tu primer ingreso o gasto y aquí verás la comparación mes a mes." action={<Link className="text-sm font-bold text-[#203c91]" to="/app/transacciones?nuevo=1">Registrar mi primer movimiento</Link>} />
          )}
          {data.transactions.length > 0 && (
            <div className="flex justify-around px-2 pt-2 text-xs text-slate-500">
              {MONTHS.map((item) => <span key={item.month}>{item.month}</span>)}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Gastos por categoría</h2>
          {expenses > 0 ? (
            <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(120px,160px)_1fr]">
              <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full" style={{ background: conic }} role="img" aria-label="Gráfico de gastos por categoría">
                <div className="flex h-[68%] w-[68%] flex-col items-center justify-center rounded-full bg-white">
                  <strong className="text-sm">{formatCurrency(expenses)}</strong>
                  <span className="text-[10px] text-slate-500">Gastos</span>
                </div>
              </div>
              <ul className="space-y-2">
                {topCategories.map((category, index) => (
                  <li key={category.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} /><span className="truncate">{category.name}</span></span>
                    <strong>{Math.round(category.total / expenses * 100)}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4"><EmptyState title="Sin gastos todavía" description="Cuando registres gastos, verás las categorías aquí." /></div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Últimas transacciones</h2>
            <Link to="/app/transacciones" className="text-xs font-semibold text-[#203c91] hover:underline">Ver todas →</Link>
          </div>
          {data.transactions.length ? (
            <div className="divide-y divide-slate-100">
              {data.transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-700'}`}>
                    {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{transaction.description}</p>
                    <p className="text-xs text-slate-500">{getCategoryName(data, transaction.categoryId)} · {formatDate(transaction.date)}</p>
                  </div>
                  <strong className={`shrink-0 text-sm ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No hay movimientos" description="Empieza registrando un ingreso o un gasto." action={<Link to="/app/transacciones?nuevo=1" className="font-semibold text-[#203c91]">Crear movimiento</Link>} />
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Metas de ahorro</h2>
          <div className="space-y-3">
            {data.goals.slice(0, 3).map((goal, index) => {
              const progress = Math.min(100, Math.round(goal.saved / goal.target * 100))
              const colors = ['bg-amber-500', 'bg-blue-700', 'bg-emerald-500']
              const backgrounds = ['bg-amber-100', 'bg-indigo-100', 'bg-emerald-100']
              return (
                <div key={goal.id} className={`rounded-xl p-3 ${backgrounds[index % backgrounds.length]}`}>
                  <div className="flex justify-between gap-2 text-xs"><span className="font-semibold">{goal.name}</span><strong>{progress}%</strong></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${progress}%` }} /></div>
                  <p className="mt-1 text-[10px] text-slate-500">{formatCurrency(goal.saved)} de {formatCurrency(goal.target)}</p>
                </div>
              )
            })}
            {!data.goals.length && <EmptyState title="Crea tu primera meta" description="Define objetivos y sigue tu progreso." />}
          </div>
          <Link to="/app/metas-de-ahorro" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#203c91]"><Star className="h-3.5 w-3.5" /> Ver metas</Link>
        </Card>
      </section>
      <p className="pb-2 text-center text-[10px] text-slate-400"><Plus className="mr-1 inline h-3 w-3" />Los datos son de demostración y se guardan localmente.</p>
    </div>
  )
}

function Metric({ label, value, icon }) {
  const isIncome = icon === 'income'
  const isExpense = icon === 'expense'
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-600' : isExpense ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-600'}`}>
        {isIncome ? <ArrowUpRight className="h-4 w-4" /> : isExpense ? <ArrowDownRight className="h-4 w-4" /> : <Star className="h-4 w-4" />}
      </span>
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${isIncome ? 'text-emerald-600' : isExpense ? 'text-red-500' : 'text-slate-900'}`}>{formatCurrency(value)}</p>
    </article>
  )
}

export default DashboardHome

// Filtros, resumen y exportacion de transacciones.
import { useState } from 'react'
import { Download, Printer } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Field,
  PageHeading,
  SelectField,
} from '../../components/FinanceUI'
import { useFinance } from '../../lib/financeStore'
import {
  getAccountName,
  getCategoryName,
  getReferenceMonth,
  monthBounds,
  summarize,
} from '../../lib/financeUtils'
import { Stat } from './shared'
import { accountOptions, categoryOptions } from './options'

const ALL_OPTION = { value: 'all', label: 'Todas' }
const CSV_HEADINGS = ['Descripción', 'Categoría', 'Cuenta', 'Fecha', 'Tipo', 'Monto']

// Convierte las filas a CSV (con BOM para que Excel respete los acentos).
function buildCsv(lines) {
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`
  return `\uFEFF${lines.map((line) => line.map(quote).join(',')).join('\n')}`
}

function downloadFile(content, filename) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function CategorySummary({ rows, data, totalExpenses }) {
  const { money } = useFinance()

  const summary = data.categories
    .map((category) => ({
      category,
      ...summarize(rows.filter((row) => row.categoryId === category.id)),
    }))
    .filter((item) => item.income || item.expenses)

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Resumen por categoría</h2>
        <span className="text-sm text-slate-500">{rows.length} movimientos</span>
      </div>
      {summary.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3">Categoría</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Balance</th>
                <th>% del gasto total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map((item) => (
                <tr key={item.category.id}>
                  <td className="py-4 font-semibold">{item.category.name}</td>
                  <td className="font-semibold text-emerald-600">
                    {item.income ? money(item.income) : '—'}
                  </td>
                  <td className="font-semibold text-red-500">
                    {item.expenses ? money(item.expenses) : '—'}
                  </td>
                  <td className="font-semibold">{money(item.balance)}</td>
                  <td>
                    {item.expenses
                      ? `${Math.round((item.expenses / Math.max(1, totalExpenses)) * 100)}%`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No hay datos para este periodo"
          description="Cambia las fechas o registra algunos movimientos."
        />
      )}
    </Card>
  )
}

export function ReportsPage() {
  const { data, money } = useFinance()

  // Por defecto el reporte cubre el mes de referencia completo.
  const { start, end } = monthBounds(getReferenceMonth(data.transactions))
  const initialFilters = { startDate: start, endDate: end, category: 'all', account: 'all' }
  const [filters, setFilters] = useState(initialFilters)
  // Los filtros solo se aplican al generar el reporte, no mientras se escribe.
  const [applied, setApplied] = useState(initialFilters)

  const setFilter = (name) => (event) =>
    setFilters((current) => ({ ...current, [name]: event.target.value }))

  const rows = data.transactions.filter(
    (item) =>
      item.date >= applied.startDate &&
      item.date <= applied.endDate &&
      (applied.category === 'all' || item.categoryId === applied.category) &&
      (applied.account === 'all' || item.accountId === applied.account),
  )
  const { income, expenses, balance } = summarize(rows)

  function exportCsv() {
    const lines = [
      CSV_HEADINGS,
      ...rows.map((item) => [
        item.description,
        getCategoryName(data, item.categoryId),
        getAccountName(data, item.accountId),
        item.date,
        item.type === 'income' ? 'Ingreso' : 'Gasto',
        item.amount,
      ]),
    ]
    downloadFile(buildCsv(lines), 'reporte-lukita.csv')
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Reportes"
        subtitle="Analiza un periodo y expórtalo con los filtros que aplicaste"
      />

      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setApplied(filters)
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <Field
            label="Desde"
            type="date"
            value={filters.startDate}
            onChange={setFilter('startDate')}
          />
          <Field
            label="Hasta"
            type="date"
            value={filters.endDate}
            onChange={setFilter('endDate')}
          />
          <SelectField
            label="Categoría"
            value={filters.category}
            onChange={setFilter('category')}
            options={[ALL_OPTION, ...categoryOptions(data.categories)]}
          />
          <SelectField
            label="Cuenta"
            value={filters.account}
            onChange={setFilter('account')}
            options={[ALL_OPTION, ...accountOptions(data.accounts)]}
          />
          <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
            <Button type="submit">Generar reporte</Button>
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Exportar Excel / CSV
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-3 md:grid-cols-3">
        <Stat
          label="Total de ingresos"
          value={money(income)}
          tone="text-emerald-600"
          detail="Periodo seleccionado"
        />
        <Stat
          label="Total de gastos"
          value={money(expenses)}
          tone="text-red-500"
          detail="Periodo seleccionado"
        />
        <Stat
          label="Balance del periodo"
          value={money(balance)}
          tone="text-[#203c91]"
          detail="Ingresos − gastos"
        />
      </section>

      <CategorySummary rows={rows} data={data} totalExpenses={expenses} />
    </div>
  )
}

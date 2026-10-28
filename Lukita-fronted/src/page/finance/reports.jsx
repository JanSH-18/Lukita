// Filtros, resumen y exportacion de transacciones.
import { useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button, Card, EmptyState, Field, PageHeading, SelectField } from '../../components/FinanceUI'
import { formatCurrency, getAccountName, getCategoryName } from '../../lib/financeUtils'
import { useFinance } from '../../lib/financeStore'
import { Stat } from './shared'
import { accountOptions, categoryOptions } from './options'

export function ReportsPage() {
  const { data } = useFinance()
  const [startDate, setStartDate] = useState('2026-10-01')
  const [endDate, setEndDate] = useState('2026-10-31')
  const [category, setCategory] = useState('all')
  const [account, setAccount] = useState('all')
  const [applied, setApplied] = useState({ startDate, endDate, category, account })
  const rows = data.transactions.filter((item) => item.date >= applied.startDate && item.date <= applied.endDate && (applied.category === 'all' || item.categoryId === applied.category) && (applied.account === 'all' || item.accountId === applied.account))
  const income = rows.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expenses = rows.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const summary = data.categories.map((item) => {
    const transactions = rows.filter((row) => row.categoryId === item.id)
    return { category: item, income: transactions.filter((row) => row.type === 'income').reduce((sum, row) => sum + row.amount, 0), expenses: transactions.filter((row) => row.type === 'expense').reduce((sum, row) => sum + row.amount, 0) }
  }).filter((item) => item.income || item.expenses)
  function exportCSV() {
    const lines = [['Descripción', 'Categoría', 'Cuenta', 'Fecha', 'Tipo', 'Monto'], ...rows.map((item) => [item.description, getCategoryName(data, item.categoryId), getAccountName(data, item.accountId), item.date, item.type === 'income' ? 'Ingreso' : 'Gasto', item.amount])]
    const content = `\uFEFF${lines.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')}`
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'reporte-lukita.csv'; link.click(); URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-5">
      <PageHeading title="Reportes" subtitle="Analiza un periodo y expórtalo con los filtros que aplicaste" />
      <Card><form onSubmit={(event) => { event.preventDefault(); setApplied({ startDate, endDate, category, account }) }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Desde" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <Field label="Hasta" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        <SelectField label="Categoría" value={category} onChange={(event) => setCategory(event.target.value)} options={[{ value: 'all', label: 'Todas' }, ...categoryOptions(data.categories)]} />
        <SelectField label="Cuenta" value={account} onChange={(event) => setAccount(event.target.value)} options={[{ value: 'all', label: 'Todas' }, ...accountOptions(data.accounts)]} />
        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4"><Button type="submit">Generar reporte</Button><Button variant="secondary" onClick={exportCSV}><Download className="h-4 w-4" />Exportar Excel / CSV</Button><Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Exportar PDF</Button></div>
      </form></Card>
      <section className="grid gap-3 md:grid-cols-3"><Stat label="Total de ingresos" value={formatCurrency(income)} tone="text-emerald-600" detail="Periodo seleccionado" /><Stat label="Total de gastos" value={formatCurrency(expenses)} tone="text-red-500" detail="Periodo seleccionado" /><Stat label="Balance del periodo" value={formatCurrency(income - expenses)} tone="text-[#203c91]" detail="Ingresos − gastos" /></section>
      <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Resumen por categoría</h2><span className="text-sm text-slate-500">{rows.length} movimientos</span></div>
        {summary.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-3">Categoría</th><th>Ingresos</th><th>Gastos</th><th>Balance</th><th>% del gasto total</th></tr></thead><tbody className="divide-y divide-slate-100">{summary.map((item) => <tr key={item.category.id}><td className="py-4 font-semibold">{item.category.name}</td><td className="font-semibold text-emerald-600">{item.income ? formatCurrency(item.income) : '—'}</td><td className="font-semibold text-red-500">{item.expenses ? formatCurrency(item.expenses) : '—'}</td><td className="font-semibold">{formatCurrency(item.income - item.expenses)}</td><td>{item.expenses ? `${Math.round(item.expenses / Math.max(1, expenses) * 100)}%` : '—'}</td></tr>)}</tbody></table></div> : <EmptyState title="No hay datos para este periodo" description="Cambia las fechas o registra algunos movimientos." />}
      </Card>
    </div>
  )
}

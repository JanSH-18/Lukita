// Componentes reutilizados por las paginas financieras.
import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { Button, Card, Field, Modal, Notice, SelectField } from '../../components/FinanceUI'
import { formatCurrency, formatDate, getCategoryName, todayISO } from '../../lib/financeUtils'
import { accountOptions, categoryOptions } from './options'

export function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      {onEdit && <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={onEdit}><Pencil className="h-3.5 w-3.5" />Editar</Button>}
      {onDelete && <Button variant="ghost" className="min-h-8 px-2 text-xs text-red-600 hover:bg-red-50" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" />Eliminar</Button>}
    </div>
  )
}

export function Stat({ label, value, tone = 'text-slate-900', detail }) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </Card>
  )
}

export function TransactionForm({ initial, categories, accounts, onSave, onClose, expensesOnly = false }) {
  const [form, setForm] = useState(() => ({
    type: expensesOnly ? 'expense' : initial?.type ?? 'expense',
    amount: initial?.amount ?? '',
    date: initial?.date ?? todayISO(),
    categoryId: initial?.categoryId ?? '',
    accountId: initial?.accountId ?? accounts[0]?.id ?? '',
    description: initial?.description ?? '',
    extra: expensesOnly || Boolean(initial?.extra),
  }))
  const [error, setError] = useState('')
  const availableCategories = categoryOptions(categories, form.type)

  function changeType(type) {
    setForm((current) => ({ ...current, type, categoryId: '' }))
  }

  function submit(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (!form.categoryId) {
      setError('Selecciona una categoría.')
      return
    }
    if (!form.accountId) {
      setError('Selecciona una cuenta.')
      return
    }
    if (!form.description.trim()) {
      setError('Ingresa una descripción.')
      return
    }
    onSave({
      ...initial,
      ...form,
      id: initial?.id ?? `tx-${crypto.randomUUID()}`,
      amount,
      description: form.description.trim(),
    })
  }

  return (
    <Modal title={expensesOnly ? 'Nuevo gasto extra' : `${initial ? 'Editar' : 'Nueva'} transacción`} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        {!expensesOnly && (
          <div>
            <p className="mb-2 text-sm font-semibold">Tipo</p>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {['income', 'expense'].map((type) => (
                <button key={type} type="button" onClick={() => changeType(type)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.type === type ? 'bg-[#203c91] text-white' : 'text-slate-600'}`}>
                  {type === 'income' ? 'Ingreso' : 'Gasto'}
                </button>
              ))}
            </div>
          </div>
        )}
        {expensesOnly && <p className="text-xs text-slate-500">El gasto extra también aparecerá en tus transacciones.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monto *" type="number" min="0.01" step="0.01" placeholder="$ 0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <Field label="Fecha *" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <SelectField label="Categoría *" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} options={[{ value: '', label: 'Selecciona una categoría' }, ...availableCategories]} />
          <SelectField label="Cuenta *" value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })} options={[{ value: '', label: 'Selecciona una cuenta' }, ...accountOptions(accounts)]} />
        </div>
        <Field label="Descripción *" placeholder="Ej. Supermercado" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{initial ? 'Guardar cambios' : expensesOnly ? 'Guardar gasto extra' : 'Guardar transacción'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export function TransactionCard({ item, data, onEdit, onDelete }) {
  const income = item.type === 'income'
  return (
    <article className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${income ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-700'}`}>{income ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{item.description}{item.extra && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">Extra</span>}</p>
        <p className="truncate text-xs text-slate-500">{getCategoryName(data, item.categoryId)} · {formatDate(item.date)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${income ? 'text-emerald-600' : 'text-red-500'}`}>{income ? '+' : '-'}{formatCurrency(item.amount)}</p>
        {(onEdit || onDelete) && <div className="mt-1 flex justify-end"><ActionButtons onEdit={onEdit} onDelete={onDelete} /></div>}
      </div>
    </article>
  )
}

export function Tag({ children }) {
  return <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-medium text-[#203c91]">{children}</span>
}

export function SummaryRow({ label, amount, total, tone }) {
  const width = Math.min(100, total > 0 ? Math.abs(amount) / total * 100 : 0)
  const color = tone.includes('emerald') ? 'text-emerald-600' : tone.includes('red') ? 'text-red-500' : tone.includes('amber') ? 'text-amber-600' : 'text-[#203c91]'
  return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-100 py-3 sm:grid-cols-[1fr_130px_minmax(100px,1fr)_50px]"><span className="font-semibold">{label}</span><strong className={color}>{formatCurrency(amount)}</strong><div className="hidden h-2 overflow-hidden rounded-full bg-slate-100 sm:block"><div className={`h-full ${tone}`} style={{ width: `${width}%` }} /></div><span className="hidden text-right text-xs text-slate-500 sm:block">{Math.round(width)}%</span></div>
}

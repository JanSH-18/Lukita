// Gestion visual de pagos y cobros recurrentes en la demo.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, Field, Modal, Notice, PageHeading, SelectField } from '../../components/FinanceUI'
import { formatCurrency, formatDate, todayISO } from '../../lib/financeUtils'
import { useFinance } from '../../lib/financeStore'
import { Tag } from './shared'
import { accountOptions } from './options'

export function RecurringPage() {
  const { data, upsert, remove } = useFinance()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'expense', amount: '', accountId: '', frequency: 'Mensual', nextDate: '' })
  const [error, setError] = useState('')
  function open(item) { setEditing(item ?? null); setForm(item ? { ...item, amount: String(item.amount) } : { name: '', type: 'expense', amount: '', accountId: data.accounts[0]?.id ?? '', frequency: 'Mensual', nextDate: todayISO() }); setError(''); setModal(true) }
  function save(event) { event.preventDefault(); const amount = Number(form.amount); if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0 || !form.accountId || !form.nextDate) return setError('Completa los campos obligatorios con valores válidos.'); upsert('recurring', { ...editing, ...form, id: editing?.id ?? `rec-${crypto.randomUUID()}`, amount, active: editing?.active ?? true }); setModal(false) }
  const activeNext = data.recurring.filter((item) => item.active && item.nextDate).slice(0, 3)
  return (
    <div className="space-y-5">
      <PageHeading title="Pagos recurrentes" subtitle="Alquiler, suscripciones, sueldo y servicios: que se registren solos" action={<Button onClick={() => open()}><Plus className="h-4 w-4" />Nuevo recurrente</Button>} />
      <Card><div className="mb-4 flex justify-between"><h2 className="text-lg font-bold">Próximos vencimientos</h2><span className="text-sm text-slate-500">Próximos 7 días</span></div><div className="grid gap-3 md:grid-cols-3">{activeNext.map((item, index) => <div key={item.id} className={`flex items-center justify-between gap-2 rounded-2xl p-4 ${index === 0 ? 'bg-amber-100' : 'bg-slate-100'}`}><div><p className="font-bold">{item.name}</p><p className="text-xs text-slate-500">Próximo: {formatDate(item.nextDate)}</p></div><strong className={item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}>{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}</strong></div>)}</div></Card>
      <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Movimientos recurrentes</h2><span className="text-sm text-slate-500">{data.recurring.length} programados</span></div><div className="divide-y divide-slate-100">{data.recurring.map((item) => <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(150px,1.3fr)_100px_110px_100px_90px_auto] sm:items-center"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-[#3154bb]">↻</span><strong>{item.name}</strong></div><Tag>{item.frequency}</Tag><span className="text-sm text-slate-500">{item.active ? formatDate(item.nextDate) : '—'}</span><strong className={item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}>{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}</strong><Tag>{item.active ? 'Activo' : 'Pausado'}</Tag><div className="flex flex-wrap gap-1"><Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => upsert('recurring', { ...item, active: !item.active })}>{item.active ? 'Pausar' : 'Reanudar'}</Button><Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => open(item)}>Editar</Button><Button variant="ghost" className="min-h-8 px-2 text-xs text-red-600" onClick={() => { if (window.confirm(`¿Eliminar "${item.name}"?`)) remove('recurring', item.id) }}>Eliminar</Button></div></div>)}</div><p className="mt-3 text-xs text-slate-500">En esta demostración, un movimiento recurrente no genera transacciones automáticamente.</p></Card>
      {modal && <Modal title={editing ? 'Editar movimiento recurrente' : 'Nuevo movimiento recurrente'} onClose={() => setModal(false)}><form onSubmit={save} className="space-y-4">
        <Field label="Nombre *" placeholder="Ej. Alquiler, Spotify, Sueldo" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <SelectField label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} options={[{ value: 'expense', label: 'Pago' }, { value: 'income', label: 'Cobro' }]} />
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Monto *" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /><SelectField label="Cuenta *" value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })} options={accountOptions(data.accounts)} /></div>
        <SelectField label="Frecuencia" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })} options={['Semanal', 'Mensual', 'Anual'].map((value) => ({ value, label: value }))} />
        <Field label="Próxima fecha *" type="date" value={form.nextDate} onChange={(event) => setForm({ ...form, nextDate: event.target.value })} />
        {error && <Notice tone="error">{error}</Notice>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit">Guardar movimiento</Button></div>
      </form></Modal>}
    </div>
  )
}

// Cuentas, perfiles financieros e ingresos/egresos del mes.
import { useState } from 'react'
import { Bell, Plus, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, Modal, Notice, PageHeading, SelectField } from '../../components/FinanceUI'
import { formatCurrency, todayISO } from '../../lib/financeUtils'
import { useFinance } from '../../lib/financeStore'
import { SummaryRow, Tag } from './shared'

export function AccountsPage() {
  const { data, upsert, remove, profile, setProfile } = useFinance()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'Banco', balance: '' })
  const [error, setError] = useState('')
  const balances = data.accounts.map((account) => {
    const tx = data.transactions.filter((item) => item.accountId === account.id)
    const income = tx.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
    const expenses = tx.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
    return { ...account, income, expenses, movementCount: tx.length }
  })
  function save(event) {
    event.preventDefault()
    const balance = Number(form.balance)
    if (!form.name.trim() || !Number.isFinite(balance) || balance < 0) return setError('Ingresa un nombre y un saldo inicial válido.')
    upsert('accounts', { id: modal.item?.id ?? `acc-${crypto.randomUUID()}`, ...form, name: form.name.trim(), balance })
    setModal(null); setError('')
  }
  return (
    <div className="space-y-5">
      <PageHeading title="Cuentas y perfiles" subtitle="Tu dinero ordenado, sin mezclar lo personal con lo empresarial" action={<Button onClick={() => { setForm({ name: '', type: 'Banco', balance: '' }); setModal({ mode: 'create' }) }}><Plus className="h-4 w-4" />Nueva cuenta</Button>} />
      <div className="flex flex-wrap items-center gap-2">
        {['personal', 'empresarial'].map((option) => <Button key={option} variant={profile === option ? 'primary' : 'secondary'} className="capitalize" onClick={() => setProfile(option)}>{option}</Button>)}
        <span className="text-sm text-slate-500">Los datos de cada perfil se mantienen separados.</span>
      </div>
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {balances.map((account) => <Card key={account.id}>
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-[#3154bb]">{account.name[0]}</span><div><h2 className="font-bold">{account.name}</h2><Tag>{account.type}</Tag></div></div><Button variant="ghost" className="min-h-8 px-2" onClick={() => { setForm({ name: account.name, type: account.type, balance: String(account.balance) }); setModal({ mode: 'edit', item: account }) }}><Pencil className="h-4 w-4" /></Button></div>
          <p className="mt-5 text-sm text-slate-500">Saldo actual</p><p className="mt-1 text-3xl font-bold">{formatCurrency(account.balance + account.income - account.expenses)}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => navigate('/app/transacciones')}>Ver movimientos</Button><Button variant="ghost" className="min-h-8 px-2 text-xs text-red-600" onClick={() => {
            if (data.transactions.some((item) => item.accountId === account.id)) return setError('No puedes eliminar una cuenta que tiene movimientos asociados.')
            if (window.confirm(`¿Eliminar la cuenta "${account.name}"?`)) remove('accounts', account.id)
          }}>Eliminar</Button></div>
        </Card>)}
      </section>
      {error && !modal && <Notice tone="error">{error}</Notice>}
      <Card>
        <h2 className="mb-3 text-lg font-bold">Resumen por cuenta · Octubre 2026</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-3">Cuenta</th><th>Movimientos</th><th>Ingresos</th><th>Gastos</th><th>Saldo</th></tr></thead><tbody className="divide-y divide-slate-100">{balances.map((account) => <tr key={account.id}><td className="py-4 font-semibold">{account.name}</td><td>{account.movementCount}</td><td className="font-semibold text-emerald-600">{formatCurrency(account.income)}</td><td className="font-semibold text-red-500">{formatCurrency(account.expenses)}</td><td className="font-bold">{formatCurrency(account.balance + account.income - account.expenses)}</td></tr>)}</tbody></table></div>
      </Card>
      {modal && <Modal title={modal.mode === 'edit' ? 'Editar cuenta' : 'Nueva cuenta'} onClose={() => setModal(null)}><form onSubmit={save} className="space-y-4">
        <SelectField label="Tipo de cuenta" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} options={['Efectivo', 'Banco', 'Tarjeta'].map((type) => ({ value: type, label: type }))} />
        <Field label="Nombre de la cuenta *" placeholder="Ej. BCP Ahorros" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Field label="Saldo inicial *" type="number" min="0" step="0.01" placeholder="$ 0.00" value={form.balance} onChange={(event) => setForm({ ...form, balance: event.target.value })} />
        <SelectField label="Perfil" value={profile} onChange={(event) => setProfile(event.target.value)} options={[{ value: 'personal', label: 'Personal' }, { value: 'empresarial', label: 'Empresarial' }]} />
        {error && <Notice tone="error">{error}</Notice>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">{modal.mode === 'edit' ? 'Guardar cambios' : 'Crear cuenta'}</Button></div>
      </form></Modal>}
    </div>
  )
}

export function MoneyPage() {
  const { data, setMonthlyIncome, upsert } = useFinance()
  const [income, setIncome] = useState(String(data.monthlyIncome))
  const [fixed, setFixed] = useState({ name: '', amount: '' })
  const [extra, setExtra] = useState({ name: '', amount: '' })
  const [notice, setNotice] = useState('')
  const fixedItems = data.recurring.filter((item) => item.type === 'expense' && item.active)
  const extraIncome = data.transactions.filter((item) => item.type === 'income' && item.categoryId === 'cat-extra-income').reduce((sum, item) => sum + item.amount, 0)
  const fixedTotal = fixedItems.reduce((sum, item) => sum + item.amount, 0)
  const extraExpenses = data.transactions.filter((item) => item.type === 'expense' && item.extra).reduce((sum, item) => sum + item.amount, 0)
  function saveIncome(event) { event.preventDefault(); const amount = Number(income); if (!Number.isFinite(amount) || amount < 0) return setNotice('Ingresa un monto válido.'); setMonthlyIncome(amount); setNotice('Ingreso mensual guardado en el navegador.') }
  function saveFixed(event) { event.preventDefault(); const amount = Number(fixed.amount); if (!fixed.name.trim() || !Number.isFinite(amount) || amount <= 0) return setNotice('Completa una descripción y un monto válido.'); upsert('recurring', { id: `rec-${crypto.randomUUID()}`, name: fixed.name.trim(), amount, type: 'expense', accountId: data.accounts[0]?.id ?? '', frequency: 'Mensual', nextDate: '2026-11-01', active: true }); setFixed({ name: '', amount: '' }); setNotice('Gasto fijo guardado.') }
  function saveExtra(event) { event.preventDefault(); const amount = Number(extra.amount); if (!extra.name.trim() || !Number.isFinite(amount) || amount <= 0) return setNotice('Completa una descripción y un monto válido.'); upsert('transactions', { id: `tx-${crypto.randomUUID()}`, description: extra.name.trim(), amount, type: 'income', categoryId: 'cat-extra-income', accountId: data.accounts[0]?.id ?? '', date: todayISO(), extra: false }); setExtra({ name: '', amount: '' }); setNotice('Ingreso extra agregado.') }
  return (
    <div className="space-y-5">
      <PageHeading title="Mi dinero" subtitle="Registra lo que ganas y lo que gastas cada mes" />
      {notice && <Notice tone="success">{notice}</Notice>}
      <section className="grid gap-4 xl:grid-cols-[1fr_1.7fr]">
        <div className="rounded-3xl bg-gradient-to-r from-[#172c69] to-[#3154bb] p-6 text-white"><p className="text-sm text-blue-100">Balance del mes</p><p className="mt-2 text-4xl font-bold">{formatCurrency(data.monthlyIncome + extraIncome - fixedTotal - extraExpenses)}</p><p className="mt-2 text-sm">Ingresos {formatCurrency(data.monthlyIncome + extraIncome)} − Egresos {formatCurrency(fixedTotal + extraExpenses)}</p></div>
        <div className="flex flex-col justify-center gap-3 rounded-3xl bg-amber-100 p-5 sm:flex-row sm:items-center"><Bell className="h-8 w-8 shrink-0 text-amber-600" /><div className="flex-1"><h2 className="font-bold">Recordatorio</h2><p className="text-sm text-slate-600">Registra tus gastos fijos para mantener tu balance al día.</p></div><Button variant="secondary" onClick={() => setNotice('Recordatorio programado en esta demostración.')}>Programar aviso</Button></div>
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <Card><h2 className="mb-4 text-lg font-bold">Ingreso total mensual</h2><form onSubmit={saveIncome} className="space-y-4"><Field label="Mes" type="month" defaultValue="2026-10" /><Field label="Monto que ganas al mes *" type="number" min="0" step="0.01" value={income} onChange={(event) => setIncome(event.target.value)} /><Button type="submit" className="w-full">Guardar ingreso</Button></form></Card>
        <Card><h2 className="mb-4 text-lg font-bold">Gastos mensuales fijos</h2><form onSubmit={saveFixed} className="space-y-4"><Field label="Descripción *" placeholder="Ej. Alquiler, internet..." value={fixed.name} onChange={(event) => setFixed({ ...fixed, name: event.target.value })} /><Field label="Monto *" type="number" min="0.01" step="0.01" placeholder="$ 0.00" value={fixed.amount} onChange={(event) => setFixed({ ...fixed, amount: event.target.value })} /><Button type="submit" className="w-full">Agregar gasto fijo</Button></form></Card>
        <Card><h2 className="mb-4 text-lg font-bold">Ingresos extra</h2><form onSubmit={saveExtra} className="space-y-4"><Field label="Descripción *" placeholder="Ej. Venta freelance" value={extra.name} onChange={(event) => setExtra({ ...extra, name: event.target.value })} /><Field label="Monto *" type="number" min="0.01" step="0.01" placeholder="$ 0.00" value={extra.amount} onChange={(event) => setExtra({ ...extra, amount: event.target.value })} /><Button type="submit" className="w-full">Agregar ingreso extra</Button></form></Card>
      </section>
      <Card><h2 className="mb-3 text-lg font-bold">Resumen del mes · Octubre 2026</h2><SummaryRow label="Ingreso mensual" amount={data.monthlyIncome} total={data.monthlyIncome + extraIncome} tone="bg-emerald-500" /><SummaryRow label="Ingresos extra" amount={extraIncome} total={data.monthlyIncome + extraIncome} tone="bg-emerald-500" /><SummaryRow label="Gastos fijos" amount={fixedTotal} total={data.monthlyIncome + extraIncome} tone="bg-red-500" /><SummaryRow label="Gastos extras" amount={extraExpenses} total={data.monthlyIncome + extraIncome} tone="bg-amber-500" /><SummaryRow label="Balance" amount={data.monthlyIncome + extraIncome - fixedTotal - extraExpenses} total={data.monthlyIncome + extraIncome} tone="bg-[#203c91]" /></Card>
    </div>
  )
}

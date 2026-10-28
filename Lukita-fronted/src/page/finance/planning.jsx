// Presupuestos y metas de ahorro; ambas vistas calculan progreso desde datos demo.
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, Field, Modal, Notice, PageHeading, SelectField } from '../../components/FinanceUI'
import { formatCurrency, formatDate } from '../../lib/financeUtils'
import { useFinance } from '../../lib/financeStore'
import { ActionButtons, Stat, Tag } from './shared'

export function BudgetsPage() {
  const { data, upsert, remove } = useFinance()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ categoryId: '', limit: '' })
  const [error, setError] = useState('')
  const expenseCategories = data.categories.filter((category) => category.type === 'expense')
  const entries = expenseCategories.map((category) => {
    const budget = data.budgets.find((item) => item.categoryId === category.id)
    const spent = data.transactions.filter((item) => item.type === 'expense' && item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0)
    return { category, budget, spent, ratio: budget ? spent / budget.limit * 100 : 0 }
  }).filter((entry) => entry.budget)
  const totalLimit = entries.reduce((sum, item) => sum + item.budget.limit, 0)
  const totalSpent = entries.reduce((sum, item) => sum + item.spent, 0)
  const totalRatio = totalLimit ? Math.round(totalSpent / totalLimit * 100) : 0
  function save(event) {
    event.preventDefault()
    const limit = Number(form.limit)
    if (!form.categoryId || !Number.isFinite(limit) || limit <= 0) return setError('Selecciona una categoría y asigna un monto válido.')
    upsert('budgets', { id: data.budgets.find((item) => item.categoryId === form.categoryId)?.id ?? `budget-${crypto.randomUUID()}`, categoryId: form.categoryId, limit })
    setModal(false); setForm({ categoryId: '', limit: '' }); setError('')
  }
  return (
    <div className="space-y-5">
      <PageHeading title="Presupuestos" subtitle="Define cuánto quieres gastar al mes en cada categoría" action={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" />Asignar presupuesto</Button>} />
      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Presupuesto total del mes" value={formatCurrency(totalLimit)} detail={`${entries.length} categorías con límite`} />
        <Stat label="Consumido" value={formatCurrency(totalSpent)} tone="text-red-500" detail={`${totalRatio}% del presupuesto total`} />
        <Stat label="Disponible" value={formatCurrency(totalLimit - totalSpent)} tone="text-emerald-600" detail="Te queda para el resto del mes" />
      </section>
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {entries.map(({ category, budget, spent, ratio }) => {
          const over = ratio > 100
          const near = ratio >= 80 && !over
          const bar = over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-[#203c91]'
          return <Card key={category.id}>
            <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-full ${over ? 'bg-red-100 text-red-600' : near ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-[#3154bb]'}`}>{category.name[0]}</span><h2 className="font-bold">{category.name}</h2></div><Tag>{over ? 'Límite superado' : near ? 'Cerca del límite' : 'En control'}</Tag></div>
            <div className="mt-5 flex items-center justify-between gap-2"><span className="font-semibold">{formatCurrency(spent)} de {formatCurrency(budget.limit)}</span><strong className={`text-xl ${over ? 'text-red-500' : near ? 'text-amber-600' : 'text-[#203c91]'}`}>{Math.round(ratio)}%</strong></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, ratio)}%` }} /></div>
            <p className={`mt-3 text-sm ${over ? 'font-semibold text-red-500' : 'text-slate-500'}`}>{over ? `Excediste el presupuesto en ${formatCurrency(spent - budget.limit)}` : `Te quedan ${formatCurrency(budget.limit - spent)}`}</p>
            {near && <Notice tone="warning">Ya consumiste el 80% o más de tu límite.</Notice>}
            {over && <div className="mt-3"><Notice tone="error">Superaste el 100% del límite de esta categoría.</Notice></div>}
            <div className="mt-4"><ActionButtons onEdit={() => { setForm({ categoryId: category.id, limit: String(budget.limit) }); setModal(true) }} onDelete={() => { if (window.confirm(`¿Quitar presupuesto de ${category.name}?`)) remove('budgets', budget.id) }} /></div>
          </Card>
        })}
      </section>
      {!entries.length && <Card><EmptyState title="Todavía no hay presupuestos" description="Asigna un límite mensual para empezar a controlar tus gastos." action={<Button onClick={() => setModal(true)}>Asignar presupuesto</Button>} /></Card>}
      {modal && <Modal title="Asignar presupuesto" onClose={() => { setModal(false); setError('') }}><form onSubmit={save} className="space-y-4">
        <SelectField label="Categoría *" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} options={[{ value: '', label: 'Selecciona una categoría' }, ...expenseCategories.map((category) => ({ value: category.id, label: category.name }))]} />
        <Field label="Monto mensual *" type="number" min="0.01" step="0.01" placeholder="$ 0.00" value={form.limit} onChange={(event) => setForm({ ...form, limit: event.target.value })} />
        <p className="text-xs text-slate-500">Recibirás una alerta visual al llegar al 80% y al superar el 100% del límite.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit">Guardar presupuesto</Button></div>
      </form></Modal>}
    </div>
  )
}

export function GoalsPage() {
  const { data, upsert, remove } = useFinance()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', target: '', dueDate: '' })
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  function addGoal(event) {
    event.preventDefault()
    const target = Number(form.target)
    if (!form.name.trim() || !Number.isFinite(target) || target <= 0 || !form.dueDate) return setError('Completa el nombre, un monto válido y la fecha límite.')
    upsert('goals', { id: `goal-${crypto.randomUUID()}`, name: form.name.trim(), target, saved: 0, dueDate: form.dueDate })
    setModal(null); setForm({ name: '', target: '', dueDate: '' }); setError('')
  }
  function contribute(event) {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return setError('El aporte debe ser mayor a 0.')
    const goal = data.goals.find((item) => item.id === modal.id)
    upsert('goals', { ...goal, saved: Math.min(goal.target, goal.saved + value) })
    setModal(null); setAmount(''); setError('')
  }
  return (
    <div className="space-y-5">
      <PageHeading title="Metas de ahorro" subtitle="Define un objetivo, una fecha y mira tu progreso" action={<Button onClick={() => setModal({ mode: 'create' })}><Plus className="h-4 w-4" />Nueva meta</Button>} />
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {data.goals.map((goal, index) => {
          const progress = Math.min(100, Math.round(goal.saved / goal.target * 100))
          const complete = progress >= 100
          return <Card key={goal.id}>
            <div className="flex items-start justify-between gap-2"><h2 className="text-lg font-bold">{goal.name}</h2><Tag>{complete ? 'Completada' : 'Meta activa'}</Tag></div>
            <p className="mt-2 text-sm text-slate-500">Fecha límite: {formatDate(goal.dueDate)}</p>
            <div className="mt-4 flex items-center justify-between gap-2"><span className="font-semibold">{formatCurrency(goal.saved)} de {formatCurrency(goal.target)}</span><strong className={`text-xl ${complete ? 'text-emerald-600' : index % 2 ? 'text-blue-700' : 'text-amber-600'}`}>{progress}%</strong></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 flex items-center justify-between gap-2"><span className={`text-sm ${complete ? 'font-semibold text-emerald-600' : 'text-slate-500'}`}>{complete ? '¡Objetivo alcanzado!' : `Faltan ${formatCurrency(goal.target - goal.saved)}`}</span><div className="flex gap-1">{!complete && <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => { setModal({ mode: 'contribute', id: goal.id }); setError('') }}>+ Aportar</Button>}<Button variant="ghost" className="min-h-8 px-2 text-xs text-red-600" onClick={() => { if (window.confirm(`¿Eliminar la meta "${goal.name}"?`)) remove('goals', goal.id) }}><Trash2 className="h-3.5 w-3.5" /></Button></div></div>
          </Card>
        })}
      </section>
      {!data.goals.length && <Card><EmptyState title="Crea tu primera meta" description="Ponle nombre, monto objetivo y fecha límite para seguir el progreso." action={<Button onClick={() => setModal({ mode: 'create' })}>Crear meta</Button>} /></Card>}
      {modal?.mode === 'create' && <Modal title="Nueva meta de ahorro" onClose={() => setModal(null)}><form className="space-y-4" onSubmit={addGoal}>
        <Field label="Nombre de la meta *" placeholder="Ej. Viaje a Cusco" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Field label="Monto objetivo *" type="number" min="0.01" step="0.01" placeholder="$ 0.00" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} />
        <Field label="Fecha límite *" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        {error && <Notice tone="error">{error}</Notice>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">Crear meta</Button></div>
      </form></Modal>}
      {modal?.mode === 'contribute' && <Modal title="Aportar a la meta" onClose={() => setModal(null)}><form className="space-y-4" onSubmit={contribute}>
        <Field label="Monto del aporte *" type="number" min="0.01" step="0.01" placeholder="$ 0.00" value={amount} onChange={(event) => setAmount(event.target.value)} />
        {error && <Notice tone="error">{error}</Notice>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">Guardar aporte</Button></div>
      </form></Modal>}
    </div>
  )
}

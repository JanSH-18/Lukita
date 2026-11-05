// Presupuestos y metas de ahorro; ambas vistas calculan su progreso con los datos demo.
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  Notice,
  PageHeading,
  SelectField,
} from '../../components/FinanceUI'
import { useFinance } from '../../lib/financeStore'
import {
  confirmDelete,
  formatDate,
  formatMonth,
  getReferenceMonth,
  inMonth,
  spentInCategory,
  sumAmounts,
} from '../../lib/financeUtils'
import { ActionButtons, Stat, Tag } from './shared'

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------
const NEAR_LIMIT_RATIO = 80
const EMPTY_BUDGET_FORM = { categoryId: '', limit: '' }

// Estado visual de un presupuesto segun cuanto se ha consumido.
function getBudgetStatus(ratio) {
  if (ratio > 100) {
    return {
      level: 'over',
      label: 'Límite superado',
      badge: 'bg-red-100 text-red-600',
      text: 'text-red-500',
      bar: 'bg-red-500',
    }
  }
  if (ratio >= NEAR_LIMIT_RATIO) {
    return {
      level: 'near',
      label: 'Cerca del límite',
      badge: 'bg-amber-100 text-amber-700',
      text: 'text-amber-600',
      bar: 'bg-amber-500',
    }
  }
  return {
    level: 'ok',
    label: 'En control',
    badge: 'bg-indigo-100 text-[#3154bb]',
    text: 'text-[#203c91]',
    bar: 'bg-[#203c91]',
  }
}

function BudgetCard({ entry, onEdit, onDelete }) {
  const { money } = useFinance()
  const { category, budget, spent, ratio } = entry
  const status = getBudgetStatus(ratio)

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${status.badge}`}
          >
            {category.name[0]}
          </span>
          <h2 className="font-bold">{category.name}</h2>
        </div>
        <Tag>{status.label}</Tag>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <span className="font-semibold">
          {money(spent)} de {money(budget.limit)}
        </span>
        <strong className={`text-xl ${status.text}`}>{Math.round(ratio)}%</strong>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${status.bar}`}
          style={{ width: `${Math.min(100, ratio)}%` }}
        />
      </div>
      <p
        className={`mt-3 text-sm ${
          status.level === 'over' ? 'font-semibold text-red-500' : 'text-slate-500'
        }`}
      >
        {status.level === 'over'
          ? `Excediste el presupuesto en ${money(spent - budget.limit)}`
          : `Te quedan ${money(budget.limit - spent)}`}
      </p>

      {status.level === 'near' && (
        <div className="mt-3">
          <Notice tone="warning">Ya consumiste el 80% o más de tu límite.</Notice>
        </div>
      )}
      {status.level === 'over' && (
        <div className="mt-3">
          <Notice tone="error">Superaste el 100% del límite de esta categoría.</Notice>
        </div>
      )}

      <div className="mt-4">
        <ActionButtons onEdit={onEdit} onDelete={onDelete} />
      </div>
    </Card>
  )
}

export function BudgetsPage() {
  const { data, money, upsert, remove } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_BUDGET_FORM)
  const [error, setError] = useState('')

  // Los presupuestos son mensuales: se comparan con los gastos del mes de referencia.
  const month = getReferenceMonth(data.transactions)
  const monthTransactions = inMonth(data.transactions, month)

  const expenseCategories = data.categories.filter((category) => category.type === 'expense')
  const entries = expenseCategories
    .map((category) => {
      const budget = data.budgets.find((item) => item.categoryId === category.id)
      const spent = spentInCategory(monthTransactions, category.id)
      return { category, budget, spent, ratio: budget ? (spent / budget.limit) * 100 : 0 }
    })
    .filter((entry) => entry.budget)

  const totalLimit = sumAmounts(entries.map((entry) => ({ amount: entry.budget.limit })))
  const totalSpent = sumAmounts(entries.map((entry) => ({ amount: entry.spent })))
  const totalRatio = totalLimit ? Math.round((totalSpent / totalLimit) * 100) : 0

  function openForm(values = EMPTY_BUDGET_FORM) {
    setForm(values)
    setError('')
    setModalOpen(true)
  }

  function closeForm() {
    setModalOpen(false)
    setForm(EMPTY_BUDGET_FORM)
    setError('')
  }

  function save(event) {
    event.preventDefault()
    const limit = Number(form.limit)
    if (!form.categoryId || !Number.isFinite(limit) || limit <= 0) {
      setError('Selecciona una categoría y asigna un monto válido.')
      return
    }
    // Si la categoria ya tenia presupuesto, se actualiza en vez de duplicarlo.
    const existing = data.budgets.find((item) => item.categoryId === form.categoryId)
    upsert('budgets', {
      id: existing?.id ?? `budget-${crypto.randomUUID()}`,
      categoryId: form.categoryId,
      limit,
    })
    closeForm()
  }

  const assignButton = (
    <Button onClick={() => openForm()}>
      <Plus className="h-4 w-4" />
      Asignar presupuesto
    </Button>
  )

  return (
    <div className="space-y-5">
      <PageHeading
        title="Presupuestos"
        subtitle="Define cuánto quieres gastar al mes en cada categoría"
        action={assignButton}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <Stat
          label={`Presupuesto total · ${formatMonth(month)}`}
          value={money(totalLimit)}
          detail={`${entries.length} categorías con límite`}
        />
        <Stat
          label="Consumido"
          value={money(totalSpent)}
          tone="text-red-500"
          detail={`${totalRatio}% del presupuesto total`}
        />
        <Stat
          label="Disponible"
          value={money(totalLimit - totalSpent)}
          tone="text-emerald-600"
          detail="Te queda para el resto del mes"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {entries.map((entry) => (
          <BudgetCard
            key={entry.category.id}
            entry={entry}
            onEdit={() =>
              openForm({
                categoryId: entry.category.id,
                limit: String(entry.budget.limit),
              })
            }
            onDelete={() => {
              if (confirmDelete(`presupuesto de ${entry.category.name}`)) {
                remove('budgets', entry.budget.id)
              }
            }}
          />
        ))}
      </section>

      {!entries.length && (
        <Card>
          <EmptyState
            title="Todavía no hay presupuestos"
            description="Asigna un límite mensual para empezar a controlar tus gastos."
            action={<Button onClick={() => openForm()}>Asignar presupuesto</Button>}
          />
        </Card>
      )}

      {modalOpen && (
        <Modal title="Asignar presupuesto" onClose={closeForm}>
          <form onSubmit={save} className="space-y-4">
            <SelectField
              label="Categoría *"
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              options={[
                { value: '', label: 'Selecciona una categoría' },
                ...expenseCategories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
            <Field
              label="Monto mensual *"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.limit}
              onChange={(event) => setForm({ ...form, limit: event.target.value })}
            />
            <p className="text-xs text-slate-500">
              Recibirás una alerta visual al llegar al 80% y al superar el 100% del límite.
            </p>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit">Guardar presupuesto</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metas de ahorro
// ---------------------------------------------------------------------------
const EMPTY_GOAL_FORM = { name: '', target: '', dueDate: '' }

function GoalCard({ goal, index, onContribute, onDelete }) {
  const { money } = useFinance()
  const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100))
  const complete = progress >= 100
  const progressColor = complete
    ? 'text-emerald-600'
    : index % 2
      ? 'text-blue-700'
      : 'text-amber-600'

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold">{goal.name}</h2>
        <Tag>{complete ? 'Completada' : 'Meta activa'}</Tag>
      </div>
      <p className="mt-2 text-sm text-slate-500">Fecha límite: {formatDate(goal.dueDate)}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-semibold">
          {money(goal.saved)} de {money(goal.target)}
        </span>
        <strong className={`text-xl ${progressColor}`}>{progress}%</strong>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={`text-sm ${complete ? 'font-semibold text-emerald-600' : 'text-slate-500'}`}
        >
          {complete ? '¡Objetivo alcanzado!' : `Faltan ${money(goal.target - goal.saved)}`}
        </span>
        <div className="flex gap-1">
          {!complete && (
            <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={onContribute}>
              + Aportar
            </Button>
          )}
          <Button
            variant="ghost"
            className="min-h-8 px-2 text-xs text-red-600"
            aria-label={`Eliminar la meta ${goal.name}`}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function NewGoalModal({ onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_GOAL_FORM)
  const [error, setError] = useState('')

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value })

  function submit(event) {
    event.preventDefault()
    const target = Number(form.target)
    if (!form.name.trim() || !Number.isFinite(target) || target <= 0 || !form.dueDate) {
      setError('Completa el nombre, un monto válido y la fecha límite.')
      return
    }
    onSave({
      id: `goal-${crypto.randomUUID()}`,
      name: form.name.trim(),
      target,
      saved: 0,
      dueDate: form.dueDate,
    })
  }

  return (
    <Modal title="Nueva meta de ahorro" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field
          label="Nombre de la meta *"
          placeholder="Ej. Viaje a Cusco"
          value={form.name}
          onChange={setField('name')}
        />
        <Field
          label="Monto objetivo *"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={form.target}
          onChange={setField('target')}
        />
        <Field
          label="Fecha límite *"
          type="date"
          value={form.dueDate}
          onChange={setField('dueDate')}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Crear meta</Button>
        </div>
      </form>
    </Modal>
  )
}

function ContributeModal({ onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('El aporte debe ser mayor a 0.')
      return
    }
    onSave(value)
  }

  return (
    <Modal title="Aportar a la meta" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <Field
          label="Monto del aporte *"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar aporte</Button>
        </div>
      </form>
    </Modal>
  )
}

export function GoalsPage() {
  const { data, upsert, remove } = useFinance()
  // null | { mode: 'create' } | { mode: 'contribute', id }
  const [modal, setModal] = useState(null)
  const closeModal = () => setModal(null)

  function addGoal(goal) {
    upsert('goals', goal)
    closeModal()
  }

  // El aporte nunca supera el monto objetivo.
  function contribute(value) {
    const goal = data.goals.find((item) => item.id === modal.id)
    upsert('goals', { ...goal, saved: Math.min(goal.target, goal.saved + value) })
    closeModal()
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Metas de ahorro"
        subtitle="Define un objetivo, una fecha y mira tu progreso"
        action={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Nueva meta
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {data.goals.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={index}
            onContribute={() => setModal({ mode: 'contribute', id: goal.id })}
            onDelete={() => {
              if (confirmDelete(goal.name)) remove('goals', goal.id)
            }}
          />
        ))}
      </section>

      {!data.goals.length && (
        <Card>
          <EmptyState
            title="Crea tu primera meta"
            description="Ponle nombre, monto objetivo y fecha límite para seguir el progreso."
            action={<Button onClick={() => setModal({ mode: 'create' })}>Crear meta</Button>}
          />
        </Card>
      )}

      {modal?.mode === 'create' && <NewGoalModal onSave={addGoal} onClose={closeModal} />}
      {modal?.mode === 'contribute' && (
        <ContributeModal onSave={contribute} onClose={closeModal} />
      )}
    </div>
  )
}

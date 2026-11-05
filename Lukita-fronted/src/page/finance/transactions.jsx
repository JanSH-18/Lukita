// Flujos de transacciones, gastos extras y mantenimiento de categorias.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  SelectField,
} from '../../components/FinanceUI'
import { useFinance } from '../../lib/financeStore'
import {
  confirmDelete,
  formatDate,
  formatMonth,
  getAccountName,
  getCategoryName,
  getReferenceMonth,
  inMonth,
  summarize,
  sumAmounts,
} from '../../lib/financeUtils'
import {
  ActionButtons,
  Stat,
  Tag,
  TransactionCard,
  TransactionForm,
} from './shared'
import { accountOptions, categoryOptions } from './options'

const TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
]
const ALL_OPTION = { value: 'all', label: 'Todas' }
const NO_FILTERS = { search: '', type: 'all', category: 'all', account: 'all' }

// ---------------------------------------------------------------------------
// Transacciones
// ---------------------------------------------------------------------------
function TransactionsTable({ items, onEdit, onDelete }) {
  const { data, money } = useFinance()
  const headings = ['Descripción', 'Categoría', 'Cuenta', 'Fecha', 'Monto', 'Acciones']

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            {headings.map((heading) => (
              <th key={heading} className="px-3 py-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const isIncome = item.type === 'income'
            return (
              <tr key={item.id}>
                <td className="px-3 py-4 font-semibold">
                  {item.description}
                  {item.extra && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-800">
                      Extra
                    </span>
                  )}
                </td>
                <td className="px-3 py-4">
                  <Tag>{getCategoryName(data, item.categoryId)}</Tag>
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {getAccountName(data, item.accountId)}
                </td>
                <td className="px-3 py-4 text-slate-500">{formatDate(item.date)}</td>
                <td
                  className={`px-3 py-4 font-bold ${
                    isIncome ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {money(item.amount)}
                </td>
                <td className="px-3 py-4">
                  <ActionButtons
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function TransactionsPage() {
  const { data, money, upsert, remove } = useFinance()
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState(NO_FILTERS)
  const [pageModal, setPageModal] = useState(null)
  const [notice, setNotice] = useState('')

  // El formulario tambien se abre desde el boton "+" con ?nuevo=1.
  const modal = pageModal ?? (params.get('nuevo') === '1' ? { mode: 'create' } : null)

  const setFilter = (name) => (event) =>
    setFilters((current) => ({ ...current, [name]: event.target.value }))

  const search = filters.search.toLowerCase()
  const filtered = data.transactions.filter(
    (item) =>
      `${item.description} ${getCategoryName(data, item.categoryId)}`
        .toLowerCase()
        .includes(search) &&
      (filters.type === 'all' || item.type === filters.type) &&
      (filters.category === 'all' || item.categoryId === filters.category) &&
      (filters.account === 'all' || item.accountId === filters.account),
  )
  const { income, expenses } = summarize(filtered)

  function openCreate() {
    setPageModal({ mode: 'create' })
  }

  function closeModal() {
    setPageModal(null)
    if (params.has('nuevo')) setParams({}, { replace: true })
  }

  function save(transaction) {
    upsert('transactions', transaction)
    closeModal()
    setNotice('Transacción guardada en los datos demo.')
  }

  const edit = (item) => setPageModal({ mode: 'edit', item })
  const askDelete = (item) => {
    if (confirmDelete(item.description)) remove('transactions', item.id)
  }

  const newButton = (
    <Button onClick={openCreate}>
      <Plus className="h-4 w-4" />
      Nueva transacción
    </Button>
  )

  return (
    <div className="space-y-5">
      <PageHeading
        title="Transacciones"
        subtitle={`${data.transactions.length} movimientos · Ingresos ${money(income)} · Gastos ${money(expenses)}`}
        action={newButton}
      />
      {notice && <Notice tone="success">{notice}</Notice>}

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Field
            label="Buscar"
            placeholder="Descripción..."
            value={filters.search}
            onChange={setFilter('search')}
          />
          <SelectField
            label="Tipo"
            value={filters.type}
            onChange={setFilter('type')}
            options={TYPE_FILTERS}
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
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setFilters(NO_FILTERS)}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Historial de movimientos</h2>
          <span className="text-xs text-slate-500">
            Mostrando {filtered.length} movimientos
          </span>
        </div>
        {filtered.length ? (
          <>
            <TransactionsTable items={filtered} onEdit={edit} onDelete={askDelete} />
            <div className="space-y-3 md:hidden">
              {filtered.map((item) => (
                <TransactionCard
                  key={item.id}
                  item={item}
                  onEdit={() => edit(item)}
                  onDelete={() => askDelete(item)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No hay movimientos"
            description="Prueba con otros filtros o registra una transacción."
            action={newButton}
          />
        )}
      </Card>

      {modal && (
        <TransactionForm
          initial={modal.item}
          categories={data.categories}
          accounts={data.accounts}
          onSave={save}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gastos extras
// ---------------------------------------------------------------------------
export function ExtraExpensesPage() {
  const { data, money, upsert, remove } = useFinance()
  const [modal, setModal] = useState(null)

  const month = getReferenceMonth(data.transactions)
  const extras = data.transactions.filter((item) => item.type === 'expense' && item.extra)
  const monthExtras = inMonth(extras, month)
  const total = sumAmounts(monthExtras)
  const impact = total ? (total / Math.max(1, data.monthlyIncome)) * 100 : 0

  function save(item) {
    upsert('transactions', { ...item, type: 'expense', extra: true })
    setModal(null)
  }

  const newButton = (
    <Button onClick={() => setModal({ mode: 'create' })}>
      <Plus className="h-4 w-4" />
      Nuevo gasto extra
    </Button>
  )

  return (
    <div className="space-y-5">
      <PageHeading
        title="Gastos extras"
        subtitle="Registra esos gastos pequeños fuera de tus gastos habituales"
        action={newButton}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <Stat
          label={`Gastos extra · ${formatMonth(month)}`}
          value={money(total)}
          tone="text-red-500"
          detail={`${monthExtras.length} gastos registrados`}
        />
        <Stat
          label="Impacto en el balance"
          value={total ? `-${impact.toFixed(1)}%` : '0%'}
          detail="Del ingreso mensual se fue en extras"
        />
        <Stat
          label="Gasto extra promedio"
          value={money(monthExtras.length ? total / monthExtras.length : 0)}
          detail="Por movimiento este mes"
        />
      </section>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Gastos extras recientes</h2>
        {extras.length ? (
          <div className="space-y-2">
            {extras.map((item) => (
              <TransactionCard
                key={item.id}
                item={item}
                onEdit={() => setModal({ mode: 'edit', item })}
                onDelete={() => {
                  if (confirmDelete(item.description)) remove('transactions', item.id)
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aún no registras gastos extras"
            description="Agrégalos para ver su impacto en tu balance."
            action={
              <Button onClick={() => setModal({ mode: 'create' })}>
                <Plus className="h-4 w-4" />
                Registrar gasto extra
              </Button>
            }
          />
        )}
      </Card>

      {modal && (
        <TransactionForm
          initial={modal.item}
          expensesOnly
          categories={data.categories}
          accounts={data.accounts}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------
const DEFAULT_COLOR = '#3154bb'
const COLOR_OPTIONS = ['#203c91', '#10b981', '#ef4444', '#f59e0b', '#3154bb']
const CATEGORY_TYPES = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

const isHexColor = (color) => Boolean(color?.startsWith('#'))

function CategoryRow({ category, count, onEdit, onDelete }) {
  const hex = isHexColor(category.color)

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
          hex ? 'text-white' : 'bg-indigo-100 text-[#3154bb]'
        }`}
        style={hex ? { backgroundColor: category.color } : undefined}
      >
        {category.name[0].toUpperCase()}
      </span>
      <div className="min-w-28 flex-1">
        <p className="font-semibold">{category.name}</p>
        <p className="text-xs text-slate-500">
          {category.system ? 'Predeterminada' : 'Personalizada'}
        </p>
      </div>
      <Tag>{category.type === 'income' ? 'Ingreso' : 'Gasto'}</Tag>
      <span className="hidden text-sm text-slate-500 sm:block">{count} movimientos</span>
      <ActionButtons onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

export function CategoriesPage() {
  const { data, upsert, remove } = useFinance()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'expense' })
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const countFor = (category) =>
    data.transactions.filter((item) => item.categoryId === category.id).length

  function resetForm() {
    setEditing(null)
    setForm({ name: '', type: 'expense' })
    setColor(DEFAULT_COLOR)
    setError('')
  }

  function startEdit(category) {
    setEditing(category)
    setForm({ name: category.name, type: category.type })
    setColor(isHexColor(category.color) ? category.color : DEFAULT_COLOR)
    setError('')
  }

  function handleDelete(category) {
    if (category.system) {
      setNotice('Las categorías predeterminadas no se pueden eliminar.')
    } else if (countFor(category)) {
      setNotice('No puedes eliminar una categoría que tiene transacciones.')
    } else if (confirmDelete(category.name)) {
      // Tambien se quitan sus presupuestos para no dejar datos huerfanos.
      data.budgets
        .filter((budget) => budget.categoryId === category.id)
        .forEach((budget) => remove('budgets', budget.id))
      remove('categories', category.id)
    }
  }

  function submit(event) {
    event.preventDefault()
    const name = form.name.trim()

    if (!name) return setError('Ingresa un nombre para la categoría.')
    const duplicated = data.categories.some(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== editing?.id,
    )
    if (duplicated) return setError('Ya existe una categoría con ese nombre.')
    if (editing && editing.type !== form.type && countFor(editing)) {
      return setError('No puedes cambiar el tipo de una categoría con transacciones.')
    }

    upsert('categories', {
      id: editing?.id ?? `cat-${crypto.randomUUID()}`,
      name,
      type: form.type,
      color,
      system: false,
    })
    setNotice(editing ? 'Categoría actualizada.' : 'Categoría creada.')
    resetForm()
  }

  return (
    <div className="space-y-5">
      <PageHeading title="Categorías" subtitle="Organiza tus ingresos y gastos a tu manera" />
      {notice && <Notice tone="success">{notice}</Notice>}

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Mis categorías</h2>
            <span className="text-sm text-slate-500">{data.categories.length} categorías</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                count={countFor(category)}
                onEdit={() => startEdit(category)}
                onDelete={() => handleDelete(category)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold">
            {editing ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Nombre *"
              placeholder="Ej. Salud"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              error={error}
            />

            <div>
              <p className="mb-2 text-sm font-semibold">Tipo</p>
              <div className="flex rounded-xl bg-slate-100 p-1">
                {CATEGORY_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, type: value })}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      form.type === value ? 'bg-[#203c91] text-white' : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Color</p>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-label={`Elegir color ${option}`}
                    aria-pressed={color === option}
                    onClick={() => setColor(option)}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${
                      color === option ? 'ring-[#203c91]' : 'ring-white'
                    }`}
                    style={{ backgroundColor: option }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editing ? 'Guardar cambios' : 'Guardar categoría'}
              </Button>
              {editing && (
                <Button variant="secondary" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

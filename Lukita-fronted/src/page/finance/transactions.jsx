// Flujos de transacciones, gastos extras y mantenimiento de categorias.
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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
import { apiFetch } from '../../lib/api'
import {
  confirmDelete,
  formatMonth,
  getReferenceMonth,
  inMonth,
  sumAmounts,
} from '../../lib/financeUtils'
import { ActionButtons, Stat, Tag, TransactionCard, TransactionForm } from './shared'

function money(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value))
}

function formatFecha(value) {
  return new Date(value).toLocaleDateString('es-PE')
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Transacciones -- unica seccion de esta pagina conectada al backend real
// (junto a voice.jsx, chat.jsx y recibos.jsx), via /api/perfiles/:id/transacciones.
// ---------------------------------------------------------------------------
const TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'gasto', label: 'Gastos' },
]
const ALL_OPTION = { value: 'all', label: 'Todas' }
const NO_FILTERS = { search: '', tipo: 'all', categoriaId: 'all', cuentaId: 'all' }
const EMPTY_FORM = { tipo: 'gasto', monto: '', fecha: hoyISO(), categoriaId: '', cuentaId: '', descripcion: '' }

function TransaccionForm({ initial, cuentas, categorias, onSave, onClose, saving }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          tipo: initial.tipo,
          monto: String(initial.monto),
          fecha: String(initial.fecha).slice(0, 10),
          categoriaId: String(initial.categoriaId),
          cuentaId: String(initial.cuentaId),
          descripcion: initial.descripcion ?? '',
        }
      : { ...EMPTY_FORM, cuentaId: cuentas[0] ? String(cuentas[0].id) : '' },
  )
  const [error, setError] = useState('')

  const setField = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }))
  const changeTipo = (tipo) => setForm((current) => ({ ...current, tipo, categoriaId: '' }))
  const categoriasDelTipo = categorias.filter((c) => c.tipo === form.tipo)

  function submit(event) {
    event.preventDefault()
    const monto = Number(form.monto)
    if (!Number.isFinite(monto) || monto <= 0) return setError('El monto debe ser mayor a 0.')
    if (!form.categoriaId) return setError('Selecciona una categoría.')
    if (!form.cuentaId) return setError('Selecciona una cuenta.')
    onSave({
      cuentaId: form.cuentaId,
      categoriaId: form.categoriaId,
      tipo: form.tipo,
      monto,
      fecha: form.fecha,
      descripcion: form.descripcion.trim() || undefined,
      esExtra: initial?.esExtra ?? false,
    })
  }

  return (
    <Modal title={initial ? 'Editar transacción' : 'Nueva transacción'} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <p className="mb-2 text-sm font-semibold">Tipo</p>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {TYPE_FILTERS.slice(1).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => changeTipo(value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  form.tipo === value ? 'bg-[#203c91] text-white' : 'text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Monto *"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.monto}
            onChange={setField('monto')}
          />
          <Field label="Fecha *" type="date" value={form.fecha} onChange={setField('fecha')} />
          <SelectField
            label="Categoría *"
            value={form.categoriaId}
            onChange={setField('categoriaId')}
            options={[
              { value: '', label: 'Selecciona una categoría' },
              ...categoriasDelTipo.map((c) => ({ value: String(c.id), label: c.nombre })),
            ]}
          />
          <SelectField
            label="Cuenta *"
            value={form.cuentaId}
            onChange={setField('cuentaId')}
            options={[
              { value: '', label: 'Selecciona una cuenta' },
              ...cuentas.map((c) => ({ value: String(c.id), label: c.nombre })),
            ]}
          />
        </div>

        <Field
          label="Descripción"
          placeholder="Ej. Supermercado"
          value={form.descripcion}
          onChange={setField('descripcion')}
        />

        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Guardar transacción'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function TransactionsTable({ items, onEdit, onDelete }) {
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
            const isIncome = item.tipo === 'ingreso'
            return (
              <tr key={item.id}>
                <td className="px-3 py-4 font-semibold">
                  {item.descripcion || item.categoria.nombre}
                  {item.esExtra && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-800">
                      Extra
                    </span>
                  )}
                </td>
                <td className="px-3 py-4">
                  <Tag>{item.categoria.nombre}</Tag>
                </td>
                <td className="px-3 py-4 text-slate-500">{item.cuenta.nombre}</td>
                <td className="px-3 py-4 text-slate-500">{formatFecha(item.fecha)}</td>
                <td
                  className={`px-3 py-4 font-bold ${
                    isIncome ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {money(item.monto)}
                </td>
                <td className="px-3 py-4">
                  <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TransactionRowCard({ item, onEdit, onDelete }) {
  const isIncome = item.tipo === 'ingreso'
  return (
    <article className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {item.descripcion || item.categoria.nombre}
          {item.esExtra && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
              Extra
            </span>
          )}
        </p>
        <p className="truncate text-xs text-slate-500">
          {item.categoria.nombre} · {item.cuenta.nombre} · {formatFecha(item.fecha)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}
          {money(item.monto)}
        </p>
        <div className="mt-1 flex justify-end">
          <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
        </div>
      </div>
    </article>
  )
}

export function TransactionsPage({ session }) {
  const [cargando, setCargando] = useState(true)
  const [perfilId, setPerfilId] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [transacciones, setTransacciones] = useState([])
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState(NO_FILTERS)
  const [pageModal, setPageModal] = useState(null)

  // El formulario tambien se abre desde el boton "+" con ?nuevo=1.
  const modal = pageModal ?? (params.get('nuevo') === '1' ? { mode: 'create' } : null)

  useEffect(() => {
    let activo = true
    async function cargarTodo() {
      try {
        const perfiles = await apiFetch('/api/perfiles', { token: session.token })
        const perfil = perfiles[0]
        if (!perfil) throw new Error('Tu cuenta todavía no tiene un perfil configurado.')
        if (!activo) return
        setPerfilId(perfil.id)

        const [cuentasRes, categoriasRes, transaccionesRes] = await Promise.all([
          apiFetch(`/api/perfiles/${perfil.id}/cuentas`, { token: session.token }),
          apiFetch(`/api/perfiles/${perfil.id}/categorias`, { token: session.token }),
          apiFetch(`/api/perfiles/${perfil.id}/transacciones`, { token: session.token }),
        ])
        if (!activo) return
        setCuentas(cuentasRes)
        setCategorias(categoriasRes)
        setTransacciones(transaccionesRes)
      } catch (error) {
        if (activo) setNotice({ tone: 'error', text: error.message ?? 'No se pudo conectar con el servidor.' })
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarTodo()
    return () => {
      activo = false
    }
  }, [session.token])

  const setFilter = (name) => (event) => setFilters((current) => ({ ...current, [name]: event.target.value }))

  const search = filters.search.toLowerCase()
  const filtered = transacciones.filter(
    (item) =>
      `${item.descripcion ?? ''} ${item.categoria.nombre}`.toLowerCase().includes(search) &&
      (filters.tipo === 'all' || item.tipo === filters.tipo) &&
      (filters.categoriaId === 'all' || String(item.categoriaId) === filters.categoriaId) &&
      (filters.cuentaId === 'all' || String(item.cuentaId) === filters.cuentaId),
  )
  const income = sumAmounts(
    filtered.filter((item) => item.tipo === 'ingreso').map((item) => ({ amount: Number(item.monto) })),
  )
  const expenses = sumAmounts(
    filtered.filter((item) => item.tipo === 'gasto').map((item) => ({ amount: Number(item.monto) })),
  )

  function closeModal() {
    setPageModal(null)
    if (params.has('nuevo')) setParams({}, { replace: true })
  }

  async function save(payload) {
    setSaving(true)
    try {
      if (modal.item) {
        const actualizada = await apiFetch(`/api/perfiles/${perfilId}/transacciones/${modal.item.id}`, {
          method: 'PUT',
          token: session.token,
          body: payload,
        })
        setTransacciones((current) => current.map((item) => (item.id === actualizada.id ? actualizada : item)))
        setNotice({ tone: 'success', text: 'Transacción actualizada.' })
      } else {
        const creada = await apiFetch(`/api/perfiles/${perfilId}/transacciones`, {
          method: 'POST',
          token: session.token,
          body: payload,
        })
        setTransacciones((current) => [creada, ...current])
        setNotice({ tone: 'success', text: 'Transacción guardada.' })
      }
      closeModal()
    } catch (error) {
      setNotice({ tone: 'error', text: error.message ?? 'No se pudo guardar la transacción.' })
    } finally {
      setSaving(false)
    }
  }

  const edit = (item) => setPageModal({ mode: 'edit', item })

  async function askDelete(item) {
    if (!confirmDelete(item.descripcion || item.categoria.nombre)) return
    try {
      await apiFetch(`/api/perfiles/${perfilId}/transacciones/${item.id}`, {
        method: 'DELETE',
        token: session.token,
      })
      setTransacciones((current) => current.filter((t) => t.id !== item.id))
    } catch (error) {
      setNotice({ tone: 'error', text: error.message ?? 'No se pudo eliminar la transacción.' })
    }
  }

  const newButton = (
    <Button onClick={() => setPageModal({ mode: 'create' })}>
      <Plus className="h-4 w-4" />
      Nueva transacción
    </Button>
  )

  if (cargando) {
    return (
      <div className="space-y-5">
        <PageHeading title="Transacciones" subtitle="Cargando tu cuenta..." />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Transacciones"
        subtitle={`${transacciones.length} movimientos · Ingresos ${money(income)} · Gastos ${money(expenses)}`}
        action={newButton}
      />
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

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
            value={filters.tipo}
            onChange={setFilter('tipo')}
            options={TYPE_FILTERS}
          />
          <SelectField
            label="Categoría"
            value={filters.categoriaId}
            onChange={setFilter('categoriaId')}
            options={[ALL_OPTION, ...categorias.map((c) => ({ value: String(c.id), label: c.nombre }))]}
          />
          <SelectField
            label="Cuenta"
            value={filters.cuentaId}
            onChange={setFilter('cuentaId')}
            options={[ALL_OPTION, ...cuentas.map((c) => ({ value: String(c.id), label: c.nombre }))]}
          />
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={() => setFilters(NO_FILTERS)}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Historial de movimientos</h2>
          <span className="text-xs text-slate-500">Mostrando {filtered.length} movimientos</span>
        </div>
        {filtered.length ? (
          <>
            <TransactionsTable items={filtered} onEdit={edit} onDelete={askDelete} />
            <div className="space-y-3 md:hidden">
              {filtered.map((item) => (
                <TransactionRowCard key={item.id} item={item} onEdit={edit} onDelete={askDelete} />
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
        <TransaccionForm
          initial={modal.item}
          cuentas={cuentas}
          categorias={categorias}
          onSave={save}
          onClose={closeModal}
          saving={saving}
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

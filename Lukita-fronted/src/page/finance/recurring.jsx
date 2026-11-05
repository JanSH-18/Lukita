// Gestion visual de pagos y cobros recurrentes en la demo.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  Card,
  Field,
  Modal,
  Notice,
  PageHeading,
  SelectField,
} from '../../components/FinanceUI'
import { useFinance } from '../../lib/financeStore'
import { confirmDelete, formatDate, todayISO } from '../../lib/financeUtils'
import { Tag } from './shared'
import { accountOptions } from './options'

const UPCOMING_LIMIT = 3
const TYPE_OPTIONS = [
  { value: 'expense', label: 'Pago' },
  { value: 'income', label: 'Cobro' },
]
const FREQUENCY_OPTIONS = ['Semanal', 'Mensual', 'Anual'].map((value) => ({
  value,
  label: value,
}))

function RecurringAmount({ item }) {
  const { money } = useFinance()
  const isIncome = item.type === 'income'

  return (
    <strong className={isIncome ? 'text-emerald-600' : 'text-red-500'}>
      {isIncome ? '+' : '-'}
      {money(item.amount)}
    </strong>
  )
}

function UpcomingPayments({ items }) {
  return (
    <Card>
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-bold">Próximos vencimientos</h2>
        <span className="text-sm text-slate-500">Los {UPCOMING_LIMIT} más cercanos</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-2 rounded-2xl p-4 ${
              index === 0 ? 'bg-amber-100' : 'bg-slate-100'
            }`}
          >
            <div>
              <p className="font-bold">{item.name}</p>
              <p className="text-xs text-slate-500">Próximo: {formatDate(item.nextDate)}</p>
            </div>
            <RecurringAmount item={item} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function RecurringRow({ item, onToggle, onEdit, onDelete }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[minmax(150px,1.3fr)_100px_110px_100px_90px_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-[#3154bb]">
          ↻
        </span>
        <strong>{item.name}</strong>
      </div>
      <Tag>{item.frequency}</Tag>
      <span className="text-sm text-slate-500">
        {item.active ? formatDate(item.nextDate) : '—'}
      </span>
      <RecurringAmount item={item} />
      <Tag>{item.active ? 'Activo' : 'Pausado'}</Tag>
      <div className="flex flex-wrap gap-1">
        <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={onToggle}>
          {item.active ? 'Pausar' : 'Reanudar'}
        </Button>
        <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="ghost" className="min-h-8 px-2 text-xs text-red-600" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </div>
  )
}

function RecurringModal({ editing, accounts, onSave, onClose }) {
  const [form, setForm] = useState(() =>
    editing
      ? { ...editing, amount: String(editing.amount) }
      : {
          name: '',
          type: 'expense',
          amount: '',
          accountId: accounts[0]?.id ?? '',
          frequency: 'Mensual',
          nextDate: todayISO(),
        },
  )
  const [error, setError] = useState('')

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value })

  function submit(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    const valid =
      form.name.trim() &&
      Number.isFinite(amount) &&
      amount > 0 &&
      form.accountId &&
      form.nextDate
    if (!valid) {
      setError('Completa los campos obligatorios con valores válidos.')
      return
    }
    onSave({
      ...editing,
      ...form,
      id: editing?.id ?? `rec-${crypto.randomUUID()}`,
      amount,
      active: editing?.active ?? true,
    })
  }

  return (
    <Modal
      title={editing ? 'Editar movimiento recurrente' : 'Nuevo movimiento recurrente'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Nombre *"
          placeholder="Ej. Alquiler, Spotify, Sueldo"
          value={form.name}
          onChange={setField('name')}
        />
        <SelectField
          label="Tipo"
          value={form.type}
          onChange={setField('type')}
          options={TYPE_OPTIONS}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Monto *"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={setField('amount')}
          />
          <SelectField
            label="Cuenta *"
            value={form.accountId}
            onChange={setField('accountId')}
            options={accountOptions(accounts)}
          />
        </div>
        <SelectField
          label="Frecuencia"
          value={form.frequency}
          onChange={setField('frequency')}
          options={FREQUENCY_OPTIONS}
        />
        <Field
          label="Próxima fecha *"
          type="date"
          value={form.nextDate}
          onChange={setField('nextDate')}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar movimiento</Button>
        </div>
      </form>
    </Modal>
  )
}

export function RecurringPage() {
  const { data, upsert, remove } = useFinance()
  // null = cerrado; { item } = abierto (item vacio al crear).
  const [modal, setModal] = useState(null)

  // Los pagos activos con fecha, del mas cercano al mas lejano.
  const upcoming = data.recurring
    .filter((item) => item.active && item.nextDate)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, UPCOMING_LIMIT)

  function save(item) {
    upsert('recurring', item)
    setModal(null)
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Pagos recurrentes"
        subtitle="Alquiler, suscripciones, sueldo y servicios: que se registren solos"
        action={
          <Button onClick={() => setModal({ item: null })}>
            <Plus className="h-4 w-4" />
            Nuevo recurrente
          </Button>
        }
      />

      <UpcomingPayments items={upcoming} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Movimientos recurrentes</h2>
          <span className="text-sm text-slate-500">{data.recurring.length} programados</span>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recurring.map((item) => (
            <RecurringRow
              key={item.id}
              item={item}
              onToggle={() => upsert('recurring', { ...item, active: !item.active })}
              onEdit={() => setModal({ item })}
              onDelete={() => {
                if (confirmDelete(item.name)) remove('recurring', item.id)
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          En esta demostración, un movimiento recurrente no genera transacciones
          automáticamente.
        </p>
      </Card>

      {modal && (
        <RecurringModal
          editing={modal.item}
          accounts={data.accounts}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

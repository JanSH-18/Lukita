// Cuentas, perfiles financieros e ingresos/egresos del mes.
import { useState } from 'react'
import { Bell, Pencil, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import {
  PROFILES,
  PROFILE_LABELS,
  confirmDelete,
  firstDayOfNextMonth,
  formatMonth,
  getAccountBalance,
  getReferenceMonth,
  inMonth,
  summarize,
  sumAmounts,
  todayISO,
} from '../../lib/financeUtils'
import { SummaryRow, Tag } from './shared'

// ---------------------------------------------------------------------------
// Cuentas y perfiles
// ---------------------------------------------------------------------------
const ACCOUNT_TYPES = ['Efectivo', 'Banco', 'Tarjeta']
const EMPTY_ACCOUNT_FORM = { name: '', type: 'Banco', balance: '' }

function AccountCard({ account, balance, onEdit, onViewMovements, onDelete }) {
  const { money } = useFinance()

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-[#3154bb]">
            {account.name[0]}
          </span>
          <div>
            <h2 className="font-bold">{account.name}</h2>
            <Tag>{account.type}</Tag>
          </div>
        </div>
        <Button
          variant="ghost"
          className="min-h-8 px-2"
          aria-label={`Editar la cuenta ${account.name}`}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-5 text-sm text-slate-500">Saldo actual</p>
      <p className="mt-1 text-3xl font-bold">{money(balance)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={onViewMovements}>
          Ver movimientos
        </Button>
        <Button variant="ghost" className="min-h-8 px-2 text-xs text-red-600" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </Card>
  )
}

function AccountModal({ mode, initial, profile, onSetProfile, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value })

  function submit(event) {
    event.preventDefault()
    const balance = Number(form.balance)
    if (!form.name.trim() || !Number.isFinite(balance) || balance < 0) {
      setError('Ingresa un nombre y un saldo inicial válido.')
      return
    }
    onSave({ ...form, name: form.name.trim(), balance })
  }

  return (
    <Modal title={mode === 'edit' ? 'Editar cuenta' : 'Nueva cuenta'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <SelectField
          label="Tipo de cuenta"
          value={form.type}
          onChange={setField('type')}
          options={ACCOUNT_TYPES.map((type) => ({ value: type, label: type }))}
        />
        <Field
          label="Nombre de la cuenta *"
          placeholder="Ej. BCP Ahorros"
          value={form.name}
          onChange={setField('name')}
        />
        <Field
          label="Saldo inicial *"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.balance}
          onChange={setField('balance')}
        />
        {/* Cambiar de perfil al editar movería la cuenta a otro perfil: solo al crear. */}
        {mode === 'create' && (
          <SelectField
            label="Perfil"
            value={profile}
            onChange={(event) => onSetProfile(event.target.value)}
            options={PROFILES.map((value) => ({ value, label: PROFILE_LABELS[value] }))}
          />
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{mode === 'edit' ? 'Guardar cambios' : 'Crear cuenta'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function AccountsSummary({ rows, month }) {
  const { money } = useFinance()

  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">Resumen por cuenta · {formatMonth(month)}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-3">Cuenta</th>
              <th>Movimientos</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ account, movements, income, expenses, balance }) => (
              <tr key={account.id}>
                <td className="py-4 font-semibold">{account.name}</td>
                <td>{movements}</td>
                <td className="font-semibold text-emerald-600">{money(income)}</td>
                <td className="font-semibold text-red-500">{money(expenses)}</td>
                <td className="font-bold">{money(balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function AccountsPage() {
  const { data, upsert, remove, profile, setProfile } = useFinance()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const [pageError, setPageError] = useState('')

  const month = getReferenceMonth(data.transactions)
  const rows = data.accounts.map((account) => {
    const monthMovements = inMonth(
      data.transactions.filter((item) => item.accountId === account.id),
      month,
    )
    return {
      account,
      movements: monthMovements.length,
      ...summarize(monthMovements),
      balance: getAccountBalance(account, data.transactions),
    }
  })

  function save(values) {
    upsert('accounts', { id: modal.item?.id ?? `acc-${crypto.randomUUID()}`, ...values })
    setModal(null)
  }

  function handleDelete(account) {
    setPageError('')
    const inUse =
      data.transactions.some((item) => item.accountId === account.id) ||
      data.recurring.some((item) => item.accountId === account.id)
    if (inUse) {
      setPageError(
        'No puedes eliminar una cuenta que tiene movimientos o pagos recurrentes asociados.',
      )
    } else if (confirmDelete(account.name)) {
      remove('accounts', account.id)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Cuentas y perfiles"
        subtitle="Tu dinero ordenado, sin mezclar lo personal con lo empresarial"
        action={
          <Button onClick={() => setModal({ mode: 'create', initial: EMPTY_ACCOUNT_FORM })}>
            <Plus className="h-4 w-4" />
            Nueva cuenta
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {PROFILES.map((option) => (
          <Button
            key={option}
            variant={profile === option ? 'primary' : 'secondary'}
            onClick={() => setProfile(option)}
          >
            {PROFILE_LABELS[option]}
          </Button>
        ))}
        <span className="text-sm text-slate-500">
          Los datos de cada perfil se mantienen separados.
        </span>
      </div>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map(({ account, balance }) => (
          <AccountCard
            key={account.id}
            account={account}
            balance={balance}
            onEdit={() =>
              setModal({
                mode: 'edit',
                item: account,
                initial: {
                  name: account.name,
                  type: account.type,
                  balance: String(account.balance),
                },
              })
            }
            onViewMovements={() => navigate('/app/transacciones')}
            onDelete={() => handleDelete(account)}
          />
        ))}
      </section>

      {pageError && <Notice tone="error">{pageError}</Notice>}
      <AccountsSummary rows={rows} month={month} />

      {modal && (
        <AccountModal
          mode={modal.mode}
          initial={modal.initial}
          profile={profile}
          onSetProfile={setProfile}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mi dinero
// ---------------------------------------------------------------------------
const EMPTY_ENTRY = { name: '', amount: '' }

// Valida una descripcion + monto y devuelve el monto, o null si no es valido.
function parseEntry(entry) {
  const amount = Number(entry.amount)
  if (!entry.name.trim() || !Number.isFinite(amount) || amount <= 0) return null
  return amount
}

export function MoneyPage() {
  const { data, money, setMonthlyIncome, upsert } = useFinance()
  const [income, setIncome] = useState(String(data.monthlyIncome))
  const [fixed, setFixed] = useState(EMPTY_ENTRY)
  const [extra, setExtra] = useState(EMPTY_ENTRY)
  const [notice, setNotice] = useState('')

  const month = getReferenceMonth(data.transactions)
  const monthTransactions = inMonth(data.transactions, month)
  const fixedItems = data.recurring.filter((item) => item.type === 'expense' && item.active)

  const extraIncome = sumAmounts(
    monthTransactions.filter(
      (item) => item.type === 'income' && item.categoryId === 'cat-extra-income',
    ),
  )
  const extraExpenses = sumAmounts(
    monthTransactions.filter((item) => item.type === 'expense' && item.extra),
  )
  const fixedTotal = sumAmounts(fixedItems)
  const totalIncome = data.monthlyIncome + extraIncome
  const totalExpenses = fixedTotal + extraExpenses
  const balance = totalIncome - totalExpenses

  const firstAccountId = data.accounts[0]?.id ?? ''
  const invalidEntry = () => setNotice('Completa una descripción y un monto válido.')

  function saveIncome(event) {
    event.preventDefault()
    const amount = Number(income)
    if (!Number.isFinite(amount) || amount < 0) return setNotice('Ingresa un monto válido.')
    setMonthlyIncome(amount)
    setNotice('Ingreso mensual guardado en el navegador.')
  }

  function saveFixed(event) {
    event.preventDefault()
    const amount = parseEntry(fixed)
    if (amount === null) return invalidEntry()
    upsert('recurring', {
      id: `rec-${crypto.randomUUID()}`,
      name: fixed.name.trim(),
      amount,
      type: 'expense',
      accountId: firstAccountId,
      frequency: 'Mensual',
      nextDate: firstDayOfNextMonth(month),
      active: true,
    })
    setFixed(EMPTY_ENTRY)
    setNotice('Gasto fijo guardado.')
  }

  function saveExtra(event) {
    event.preventDefault()
    const amount = parseEntry(extra)
    if (amount === null) return invalidEntry()
    upsert('transactions', {
      id: `tx-${crypto.randomUUID()}`,
      description: extra.name.trim(),
      amount,
      type: 'income',
      categoryId: 'cat-extra-income',
      accountId: firstAccountId,
      date: todayISO(),
      extra: false,
    })
    setExtra(EMPTY_ENTRY)
    setNotice('Ingreso extra agregado.')
  }

  return (
    <div className="space-y-5">
      <PageHeading title="Mi dinero" subtitle="Registra lo que ganas y lo que gastas cada mes" />
      {notice && <Notice tone="success">{notice}</Notice>}

      <section className="grid gap-4 xl:grid-cols-[1fr_1.7fr]">
        <div className="rounded-3xl bg-gradient-to-r from-[#172c69] to-[#3154bb] p-6 text-white">
          <p className="text-sm text-blue-100">Balance del mes</p>
          <p className="mt-2 text-4xl font-bold">{money(balance)}</p>
          <p className="mt-2 text-sm">
            Ingresos {money(totalIncome)} − Egresos {money(totalExpenses)}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 rounded-3xl bg-amber-100 p-5 sm:flex-row sm:items-center">
          <Bell className="h-8 w-8 shrink-0 text-amber-600" />
          <div className="flex-1">
            <h2 className="font-bold">Recordatorio</h2>
            <p className="text-sm text-slate-600">
              Registra tus gastos fijos para mantener tu balance al día.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setNotice('Recordatorio programado en esta demostración.')}
          >
            Programar aviso
          </Button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Ingreso total mensual</h2>
          <form onSubmit={saveIncome} className="space-y-4">
            <Field label="Mes" type="month" value={month} readOnly />
            <Field
              label="Monto que ganas al mes *"
              type="number"
              min="0"
              step="0.01"
              value={income}
              onChange={(event) => setIncome(event.target.value)}
            />
            <Button type="submit" className="w-full">
              Guardar ingreso
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold">Gastos mensuales fijos</h2>
          <form onSubmit={saveFixed} className="space-y-4">
            <Field
              label="Descripción *"
              placeholder="Ej. Alquiler, internet..."
              value={fixed.name}
              onChange={(event) => setFixed({ ...fixed, name: event.target.value })}
            />
            <Field
              label="Monto *"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={fixed.amount}
              onChange={(event) => setFixed({ ...fixed, amount: event.target.value })}
            />
            <Button type="submit" className="w-full">
              Agregar gasto fijo
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold">Ingresos extra</h2>
          <form onSubmit={saveExtra} className="space-y-4">
            <Field
              label="Descripción *"
              placeholder="Ej. Venta freelance"
              value={extra.name}
              onChange={(event) => setExtra({ ...extra, name: event.target.value })}
            />
            <Field
              label="Monto *"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={extra.amount}
              onChange={(event) => setExtra({ ...extra, amount: event.target.value })}
            />
            <Button type="submit" className="w-full">
              Agregar ingreso extra
            </Button>
          </form>
        </Card>
      </section>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Resumen del mes · {formatMonth(month)}</h2>
        <SummaryRow label="Ingreso mensual" amount={data.monthlyIncome} total={totalIncome} tone="emerald" />
        <SummaryRow label="Ingresos extra" amount={extraIncome} total={totalIncome} tone="emerald" />
        <SummaryRow label="Gastos fijos" amount={fixedTotal} total={totalIncome} tone="red" />
        <SummaryRow label="Gastos extras" amount={extraExpenses} total={totalIncome} tone="amber" />
        <SummaryRow label="Balance" amount={balance} total={totalIncome} tone="blue" />
      </Card>
    </div>
  )
}

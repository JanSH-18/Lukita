// Flujos de transacciones, gastos extras y mantenimiento de categorias.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, EmptyState, Field, Notice, PageHeading, SelectField } from '../../components/FinanceUI'
import { formatCurrency, formatDate, getAccountName, getCategoryName } from '../../lib/financeUtils'
import { useFinance } from '../../lib/financeStore'
import { ActionButtons, Stat, Tag, TransactionCard, TransactionForm } from './shared'
import { accountOptions, categoryOptions } from './options'

export function TransactionsPage() {
  const { data, upsert, remove } = useFinance()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [account, setAccount] = useState('all')
  const [pageModal, setPageModal] = useState(null)
  const modal = pageModal ?? (params.get('nuevo') === '1' ? { mode: 'create' } : null)
  const [notice, setNotice] = useState('')

  function closeModal() {
    setPageModal(null)
    if (params.has('nuevo')) setParams({}, { replace: true })
  }

  const filtered = data.transactions.filter((item) => {
    const queryMatch = `${item.description} ${getCategoryName(data, item.categoryId)}`.toLowerCase().includes(search.toLowerCase())
    return queryMatch &&
      (type === 'all' || item.type === type) &&
      (category === 'all' || item.categoryId === category) &&
      (account === 'all' || item.accountId === account)
  })
  const incomes = filtered.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expenses = filtered.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)

  function save(transaction) {
    upsert('transactions', transaction)
    closeModal()
    setNotice('Transacción guardada en los datos demo.')
  }

  return (
    <div className="space-y-5">
      <PageHeading title="Transacciones" subtitle={`${data.transactions.length} movimientos · Ingresos ${formatCurrency(incomes)} · Gastos ${formatCurrency(expenses)}`} action={<Button onClick={() => setPageModal({ mode: 'create' })}><Plus className="h-4 w-4" />Nueva transacción</Button>} />
      {notice && <Notice tone="success">{notice}</Notice>}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="Buscar" placeholder="Descripción..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <SelectField label="Tipo" value={type} onChange={(event) => setType(event.target.value)} options={[{ value: 'all', label: 'Todos' }, { value: 'income', label: 'Ingresos' }, { value: 'expense', label: 'Gastos' }]} />
          <SelectField label="Categoría" value={category} onChange={(event) => setCategory(event.target.value)} options={[{ value: 'all', label: 'Todas' }, ...categoryOptions(data.categories)]} />
          <SelectField label="Cuenta" value={account} onChange={(event) => setAccount(event.target.value)} options={[{ value: 'all', label: 'Todas' }, ...accountOptions(data.accounts)]} />
          <div className="flex items-end"><Button variant="secondary" className="w-full" onClick={() => { setSearch(''); setType('all'); setCategory('all'); setAccount('all') }}>Limpiar filtros</Button></div>
        </div>
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Historial de movimientos</h2>
          <span className="text-xs text-slate-500">Mostrando {filtered.length} movimientos</span>
        </div>
        {filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr>{['Descripción', 'Categoría', 'Cuenta', 'Fecha', 'Monto', 'Acciones'].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => <tr key={item.id}>
                    <td className="px-3 py-4 font-semibold">{item.description}{item.extra && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-800">Extra</span>}</td>
                    <td className="px-3 py-4"><Tag>{getCategoryName(data, item.categoryId)}</Tag></td>
                    <td className="px-3 py-4 text-slate-500">{getAccountName(data, item.accountId)}</td>
                    <td className="px-3 py-4 text-slate-500">{formatDate(item.date)}</td>
                    <td className={`px-3 py-4 font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>{item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}</td>
                    <td className="px-3 py-4"><ActionButtons onEdit={() => setPageModal({ mode: 'edit', item })} onDelete={() => { if (window.confirm(`¿Eliminar "${item.description}"?`)) remove('transactions', item.id) }} /></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {filtered.map((item) => <TransactionCard key={item.id} item={item} data={data} onEdit={() => setPageModal({ mode: 'edit', item })} onDelete={() => { if (window.confirm(`¿Eliminar "${item.description}"?`)) remove('transactions', item.id) }} />)}
            </div>
          </>
        ) : <EmptyState title="No hay movimientos" description="Prueba con otros filtros o registra una transacción." action={<Button onClick={() => setPageModal({ mode: 'create' })}><Plus className="h-4 w-4" />Nueva transacción</Button>} />}
      </Card>
      {modal && <TransactionForm initial={modal.item} categories={data.categories} accounts={data.accounts} onSave={save} onClose={closeModal} />}
    </div>
  )
}

export function ExtraExpensesPage() {
  const { data, upsert, remove } = useFinance()
  const [modal, setModal] = useState(null)
  const extras = data.transactions.filter((item) => item.type === 'expense' && item.extra)
  const total = extras.reduce((sum, item) => sum + item.amount, 0)
  return (
    <div className="space-y-5">
      <PageHeading title="Gastos extras" subtitle="Registra esos gastos pequeños fuera de tus gastos habituales" action={<Button onClick={() => setModal({ mode: 'create' })}><Plus className="h-4 w-4" />Nuevo gasto extra</Button>} />
      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Total de gastos extra del mes" value={formatCurrency(total)} tone="text-red-500" detail={`${extras.length} gastos registrados`} />
        <Stat label="Impacto en el balance" value={total ? `-${(total / Math.max(1, data.monthlyIncome) * 100).toFixed(1)}%` : '0%'} detail="Del ingreso mensual se fue en extras" />
        <Stat label="Gasto extra promedio" value={formatCurrency(extras.length ? total / extras.length : 0)} detail="Por movimiento este mes" />
      </section>
      <Card>
        <h2 className="mb-4 text-lg font-bold">Gastos extras recientes</h2>
        {extras.length ? (
          <div className="space-y-2">
            {extras.map((item) => <TransactionCard key={item.id} item={item} data={data} onEdit={() => setModal({ mode: 'edit', item })} onDelete={() => { if (window.confirm(`¿Eliminar "${item.description}"?`)) remove('transactions', item.id) }} />)}
          </div>
        ) : <EmptyState title="Aún no registras gastos extras" description="Agrégalos para ver su impacto en tu balance." action={<Button onClick={() => setModal({ mode: 'create' })}><Plus className="h-4 w-4" />Registrar gasto extra</Button>} />}
      </Card>
      {modal && <TransactionForm initial={modal.item} expensesOnly categories={data.categories} accounts={data.accounts} onClose={() => setModal(null)} onSave={(item) => { upsert('transactions', { ...item, type: 'expense', extra: true }); setModal(null) }} />}
    </div>
  )
}

export function CategoriesPage() {
  const { data, upsert, remove } = useFinance()
  const [color, setColor] = useState('#3154bb')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'expense' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  function reset() { setForm({ name: '', type: 'expense' }); setColor('#3154bb'); setEditing(null); setError('') }
  function submit(event) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) return setError('Ingresa un nombre para la categoría.')
    if (data.categories.some((item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== editing?.id)) return setError('Ya existe una categoría con ese nombre.')
    upsert('categories', { id: editing?.id ?? `cat-${crypto.randomUUID()}`, name, type: form.type, color, system: false })
    setNotice(editing ? 'Categoría actualizada.' : 'Categoría creada.')
    reset()
  }
  return (
    <div className="space-y-5">
      <PageHeading title="Categorías" subtitle="Organiza tus ingresos y gastos a tu manera" />
      {notice && <Notice tone="success">{notice}</Notice>}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Mis categorías</h2><span className="text-sm text-slate-500">{data.categories.length} categorías</span></div>
          <div className="divide-y divide-slate-100">
            {data.categories.map((category) => {
              const count = data.transactions.filter((item) => item.categoryId === category.id).length
              return <div key={category.id} className="flex flex-wrap items-center gap-3 py-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${category.color?.startsWith('#') ? 'text-white' : 'bg-indigo-100 text-[#3154bb]'}`} style={category.color?.startsWith('#') ? { backgroundColor: category.color } : undefined}>{category.name[0].toUpperCase()}</span>
                <div className="min-w-28 flex-1"><p className="font-semibold">{category.name}</p><p className="text-xs text-slate-500">{category.system ? 'Predeterminada' : 'Personalizada'}</p></div>
                <Tag>{category.type === 'income' ? 'Ingreso' : 'Gasto'}</Tag>
                <span className="hidden text-sm text-slate-500 sm:block">{count} movimientos</span>
                <ActionButtons onEdit={() => { setEditing(category); setForm({ name: category.name, type: category.type }); setColor(category.color?.startsWith('#') ? category.color : '#3154bb') }} onDelete={() => {
                  if (category.system) return setNotice('Las categorías predeterminadas no se pueden eliminar.')
                  if (count) return setNotice('No puedes eliminar una categoría que tiene transacciones.')
                  if (window.confirm(`¿Eliminar la categoría "${category.name}"?`)) remove('categories', category.id)
                }} />
              </div>
            })}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nombre *" placeholder="Ej. Salud" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} error={error} />
            <div><p className="mb-2 text-sm font-semibold">Tipo</p><div className="flex rounded-xl bg-slate-100 p-1">{['expense', 'income'].map((type) => <button key={type} type="button" onClick={() => setForm({ ...form, type })} className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.type === type ? 'bg-[#203c91] text-white' : 'text-slate-600'}`}>{type === 'expense' ? 'Gasto' : 'Ingreso'}</button>)}</div></div>
            <div><p className="mb-2 text-sm font-semibold">Color</p><div className="flex gap-2">{['#203c91', '#10b981', '#ef4444', '#f59e0b', '#3154bb'].map((option) => <button key={option} type="button" aria-label={`Elegir color ${option}`} aria-pressed={color === option} onClick={() => setColor(option)} className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${color === option ? 'ring-[#203c91]' : 'ring-white'}`} style={{ backgroundColor: option }} />)}</div></div>
            <div className="flex gap-2"><Button type="submit" className="flex-1">{editing ? 'Guardar cambios' : 'Guardar categoría'}</Button>{editing && <Button variant="secondary" onClick={reset}>Cancelar</Button>}</div>
          </form>
        </Card>
      </div>
    </div>
  )
}

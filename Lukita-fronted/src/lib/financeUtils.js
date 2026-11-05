// Formatos, calculos y nombres de referencia compartidos por las vistas.

// ---------------------------------------------------------------------------
// Perfiles
// ---------------------------------------------------------------------------
export const PROFILE_LABELS = { personal: 'Personal', empresarial: 'Empresarial' }
export const PROFILES = Object.keys(PROFILE_LABELS)

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------
const CURRENCY_LOCALES = { USD: 'en-US', PEN: 'es-PE', EUR: 'es-ES' }

export function formatCurrency(amount, currencyCode = 'USD') {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currencyCode] ?? 'en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(Number(amount) || 0)
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(`${date}T12:00:00`))
    .replace('.', '')
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

// '2026-10' -> 'Octubre 2026'
export function formatMonth(month) {
  const label = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })
    .format(new Date(`${month}-15T12:00:00`))
    .replace(' de ', ' ')
  return capitalize(label)
}

// '2026-10' -> 'Oct'
export function formatShortMonth(month) {
  const label = new Intl.DateTimeFormat('es', { month: 'short' })
    .format(new Date(`${month}-15T12:00:00`))
    .replace('.', '')
  return capitalize(label)
}

// ---------------------------------------------------------------------------
// Fechas y meses ('AAAA-MM')
// ---------------------------------------------------------------------------
const pad = (number) => String(number).padStart(2, '0')

export function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const monthOf = (date) => String(date).slice(0, 7)

// Mes con el que trabajan los resumenes "del mes": el de la transaccion mas
// reciente (asi los datos de ejemplo siempre se ven) o el mes actual si no hay.
export function getReferenceMonth(transactions) {
  const latest = transactions.reduce(
    (max, item) => (item.date > max ? item.date : max),
    '',
  )
  return monthOf(latest || todayISO())
}

// Lista de `count` meses que termina en `month`.
export function lastMonths(month, count) {
  const [year, number] = month.split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, number - 1 - (count - 1 - index), 1)
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
  })
}

export function monthBounds(month) {
  const [year, number] = month.split('-').map(Number)
  const lastDay = new Date(year, number, 0).getDate()
  return { start: `${month}-01`, end: `${month}-${pad(lastDay)}` }
}

export function firstDayOfNextMonth(month) {
  const [year, number] = month.split('-').map(Number)
  const next = new Date(year, number, 1)
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`
}

// ---------------------------------------------------------------------------
// Calculos sobre transacciones
// ---------------------------------------------------------------------------
export const sumAmounts = (items) =>
  items.reduce((total, item) => total + item.amount, 0)

export function summarize(transactions) {
  const income = sumAmounts(transactions.filter((item) => item.type === 'income'))
  const expenses = sumAmounts(transactions.filter((item) => item.type === 'expense'))
  return { income, expenses, balance: income - expenses }
}

export const inMonth = (transactions, month) =>
  transactions.filter((item) => monthOf(item.date) === month)

export const spentInCategory = (transactions, categoryId) =>
  sumAmounts(
    transactions.filter(
      (item) => item.type === 'expense' && item.categoryId === categoryId,
    ),
  )

// Saldo actual = saldo inicial + ingresos - gastos de la cuenta.
export function getAccountBalance(account, transactions) {
  const own = transactions.filter((item) => item.accountId === account.id)
  return account.balance + summarize(own).balance
}

// ---------------------------------------------------------------------------
// Nombres de referencia
// ---------------------------------------------------------------------------
export function getCategoryName(data, categoryId) {
  return (
    data.categories.find((category) => category.id === categoryId)?.name ??
    'Sin categoría'
  )
}

export function getAccountName(data, accountId) {
  return (
    data.accounts.find((account) => account.id === accountId)?.name ?? 'Sin cuenta'
  )
}

// ---------------------------------------------------------------------------
// Confirmaciones
// ---------------------------------------------------------------------------
// Pregunta antes de borrar algo; devuelve true si el usuario acepta.
export const confirmDelete = (label) => window.confirm(`¿Eliminar "${label}"?`)

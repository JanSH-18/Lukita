// Formateadores y resolutores de referencias compartidos por las vistas.
export function getCategoryName(data, categoryId) {
  return data.categories.find((category) => category.id === categoryId)?.name ?? 'Sin categoría'
}

export function getAccountName(data, accountId) {
  return data.accounts.find((account) => account.id === accountId)?.name ?? 'Sin cuenta'
}

export function formatCurrency(amount, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(Number(amount) || 0)
}

export function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}

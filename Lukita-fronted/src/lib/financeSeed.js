// Datos de ejemplo (se cargan desde Configuracion) y estado vacio de las cuentas nuevas.

const categories = [
  { id: 'cat-food', name: 'Alimentación', type: 'expense', color: 'amber', system: true },
  { id: 'cat-transport', name: 'Transporte', type: 'expense', color: 'red', system: true },
  { id: 'cat-study', name: 'Estudios', type: 'expense', color: 'blue', system: true },
  { id: 'cat-leisure', name: 'Ocio', type: 'expense', color: 'indigo', system: true },
  { id: 'cat-home', name: 'Vivienda', type: 'expense', color: 'blue', system: true },
  { id: 'cat-health', name: 'Salud', type: 'expense', color: 'emerald', system: true },
  { id: 'cat-salary', name: 'Sueldo', type: 'income', color: 'emerald', system: true },
  { id: 'cat-extra-income', name: 'Ingresos extra', type: 'income', color: 'emerald', system: true },
]

// Mes mas reciente (octubre 2026), de la fecha mas nueva a la mas antigua.
const currentMonthTransactions = [
  { id: 'tx-1', description: 'Pago de sueldo', type: 'income', amount: 3200, categoryId: 'cat-salary', accountId: 'acc-bank', date: '2026-10-14', extra: false },
  { id: 'tx-2', description: 'Alquiler de departamento', type: 'expense', amount: 900, categoryId: 'cat-home', accountId: 'acc-bank', date: '2026-10-12', extra: false },
  { id: 'tx-3', description: 'Supermercado', type: 'expense', amount: 85.4, categoryId: 'cat-food', accountId: 'acc-cash', date: '2026-10-11', extra: false },
  { id: 'tx-4', description: 'Recarga de transporte', type: 'expense', amount: 25, categoryId: 'cat-transport', accountId: 'acc-card', date: '2026-10-10', extra: false },
  { id: 'tx-5', description: 'Venta freelance', type: 'income', amount: 450, categoryId: 'cat-extra-income', accountId: 'acc-bank', date: '2026-10-09', extra: false },
  { id: 'tx-6', description: 'Entradas de cine', type: 'expense', amount: 32, categoryId: 'cat-leisure', accountId: 'acc-cash', date: '2026-10-08', extra: true },
  { id: 'tx-7', description: 'Curso de inglés', type: 'expense', amount: 120, categoryId: 'cat-study', accountId: 'acc-card', date: '2026-10-06', extra: false },
  { id: 'tx-8', description: 'Cena con amigos', type: 'expense', amount: 64.5, categoryId: 'cat-leisure', accountId: 'acc-cash', date: '2026-10-05', extra: true },
]

// Meses anteriores (mas reciente primero): alimentan el grafico mensual del dashboard.
const earlierMonths = [
  { month: '2026-09', salary: 3200, groceries: 210 },
  { month: '2026-08', salary: 3000, groceries: 260 },
  { month: '2026-07', salary: 3100, groceries: 190 },
  { month: '2026-06', salary: 2900, groceries: 240 },
  { month: '2026-05', salary: 2900, groceries: 180 },
]

const earlierTransactions = earlierMonths.flatMap(({ month, salary, groceries }) => [
  { id: `tx-${month}-salary`, description: 'Pago de sueldo', type: 'income', amount: salary, categoryId: 'cat-salary', accountId: 'acc-bank', date: `${month}-14`, extra: false },
  { id: `tx-${month}-rent`, description: 'Alquiler de departamento', type: 'expense', amount: 900, categoryId: 'cat-home', accountId: 'acc-bank', date: `${month}-12`, extra: false },
  { id: `tx-${month}-food`, description: 'Supermercado', type: 'expense', amount: groceries, categoryId: 'cat-food', accountId: 'acc-cash', date: `${month}-11`, extra: false },
])

const budgets = [
  { id: 'budget-1', categoryId: 'cat-food', limit: 500 },
  { id: 'budget-2', categoryId: 'cat-transport', limit: 120 },
  { id: 'budget-3', categoryId: 'cat-home', limit: 1200 },
  { id: 'budget-4', categoryId: 'cat-leisure', limit: 200 },
  { id: 'budget-5', categoryId: 'cat-study', limit: 300 },
  { id: 'budget-6', categoryId: 'cat-health', limit: 180 },
]

const goals = [
  { id: 'goal-1', name: 'Viaje de vacaciones', target: 3000, saved: 2040, dueDate: '2026-12-31' },
  { id: 'goal-2', name: 'Laptop nueva', target: 2500, saved: 850, dueDate: '2027-06-30' },
  { id: 'goal-3', name: 'Fondo de emergencia', target: 1500, saved: 1200, dueDate: '2027-03-31' },
  { id: 'goal-4', name: 'Curso de programación', target: 300, saved: 300, dueDate: '2026-09-15' },
]

const accounts = [
  { id: 'acc-cash', name: 'Efectivo', type: 'Efectivo', balance: 240 },
  { id: 'acc-bank', name: 'BCP Ahorros', type: 'Banco', balance: 1500 },
  { id: 'acc-card', name: 'Tarjeta Visa', type: 'Tarjeta', balance: 2300 },
]

const recurring = [
  { id: 'rec-1', name: 'Alquiler de departamento', type: 'expense', amount: 900, accountId: 'acc-bank', frequency: 'Mensual', nextDate: '2026-11-01', active: true },
  { id: 'rec-2', name: 'Netflix', type: 'expense', amount: 15.99, accountId: 'acc-card', frequency: 'Mensual', nextDate: '2026-10-24', active: true },
  { id: 'rec-3', name: 'Sueldo', type: 'income', amount: 3200, accountId: 'acc-bank', frequency: 'Mensual', nextDate: '2026-10-30', active: true },
  { id: 'rec-4', name: 'Seguro de salud', type: 'expense', amount: 480, accountId: 'acc-bank', frequency: 'Anual', nextDate: '2027-03-12', active: true },
  { id: 'rec-5', name: 'Gimnasio', type: 'expense', amount: 35, accountId: 'acc-card', frequency: 'Mensual', nextDate: '', active: false },
  { id: 'rec-6', name: 'Ahorro automático', type: 'expense', amount: 20, accountId: 'acc-bank', frequency: 'Semanal', nextDate: '2026-10-25', active: true },
]

const preferences = {
  currency: 'USD',
  language: 'Español',
  dateFormat: 'dd/mm/aaaa',
  budgetAlerts: true,
  recurringAlerts: true,
  fixedExpenseAlerts: true,
  weeklySummary: false,
}

const copyAll = (items) => items.map((item) => ({ ...item }))

const emptyAccount = { id: 'acc-cash', name: 'Efectivo', type: 'Efectivo', balance: 0 }

// Perfil con todos los datos de ejemplo.
function createDemoProfileData() {
  return {
    categories: copyAll(categories),
    transactions: copyAll([...currentMonthTransactions, ...earlierTransactions]),
    budgets: copyAll(budgets),
    goals: copyAll(goals),
    accounts: copyAll(accounts),
    recurring: copyAll(recurring),
    monthlyIncome: 8500,
    preferences: { ...preferences },
  }
}

// Perfil de una cuenta nueva: sin movimientos, solo categorias y una cuenta "Efectivo".
function createEmptyProfileData() {
  return {
    categories: copyAll(categories),
    transactions: [],
    budgets: [],
    goals: [],
    accounts: [{ ...emptyAccount }],
    recurring: [],
    monthlyIncome: 0,
    preferences: { ...preferences },
  }
}

// En el perfil empresarial "Vivienda" pasa a ser el alquiler del local y se
// agrega la categoria "Operaciones".
function toBusinessProfile(data) {
  const renamed = data.categories.map((category) =>
    category.id === 'cat-home' ? { ...category, name: 'Alquiler del local' } : category,
  )
  const operations = {
    id: 'cat-business',
    name: 'Operaciones',
    type: 'expense',
    color: 'indigo',
    system: true,
  }
  return { ...data, categories: [...renamed, operations] }
}

// Cada perfil recibe copias independientes para no mezclar sus cambios.
function buildState(createProfile) {
  return {
    activeProfile: 'personal',
    profiles: {
      personal: createProfile(),
      empresarial: toBusinessProfile(createProfile()),
    },
  }
}

// Datos de ejemplo (se cargan desde Configuracion).
export const createDemoState = () => buildState(createDemoProfileData)

// Estado inicial de una cuenta nueva: todo en cero.
export const createEmptyState = () => buildState(createEmptyProfileData)

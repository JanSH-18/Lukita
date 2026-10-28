// Semillas, persistencia local y contexto consumido por las paginas financieras.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'lukita_finance_demo_v1'
const FinanceContext = createContext(null)

// Datos ilustrativos usados al iniciar cada perfil por primera vez.
const initialCategories = [
  { id: 'cat-food', name: 'Alimentación', type: 'expense', color: 'amber', system: true },
  { id: 'cat-transport', name: 'Transporte', type: 'expense', color: 'red', system: true },
  { id: 'cat-study', name: 'Estudios', type: 'expense', color: 'blue', system: true },
  { id: 'cat-leisure', name: 'Ocio', type: 'expense', color: 'indigo', system: true },
  { id: 'cat-home', name: 'Vivienda', type: 'expense', color: 'blue', system: true },
  { id: 'cat-health', name: 'Salud', type: 'expense', color: 'emerald', system: true },
  { id: 'cat-salary', name: 'Sueldo', type: 'income', color: 'emerald', system: true },
  { id: 'cat-extra-income', name: 'Ingresos extra', type: 'income', color: 'emerald', system: true },
]

const initialTransactions = [
  { id: 'tx-1', description: 'Pago de sueldo', type: 'income', amount: 3200, categoryId: 'cat-salary', accountId: 'acc-bank', date: '2026-10-14', extra: false },
  { id: 'tx-2', description: 'Alquiler de departamento', type: 'expense', amount: 900, categoryId: 'cat-home', accountId: 'acc-bank', date: '2026-10-12', extra: false },
  { id: 'tx-3', description: 'Supermercado', type: 'expense', amount: 85.4, categoryId: 'cat-food', accountId: 'acc-cash', date: '2026-10-11', extra: false },
  { id: 'tx-4', description: 'Recarga de transporte', type: 'expense', amount: 25, categoryId: 'cat-transport', accountId: 'acc-card', date: '2026-10-10', extra: false },
  { id: 'tx-5', description: 'Venta freelance', type: 'income', amount: 450, categoryId: 'cat-extra-income', accountId: 'acc-bank', date: '2026-10-09', extra: false },
  { id: 'tx-6', description: 'Entradas de cine', type: 'expense', amount: 32, categoryId: 'cat-leisure', accountId: 'acc-cash', date: '2026-10-08', extra: true },
  { id: 'tx-7', description: 'Curso de inglés', type: 'expense', amount: 120, categoryId: 'cat-study', accountId: 'acc-card', date: '2026-10-06', extra: false },
  { id: 'tx-8', description: 'Cena con amigos', type: 'expense', amount: 64.5, categoryId: 'cat-leisure', accountId: 'acc-cash', date: '2026-10-05', extra: true },
]

function createProfileData() {
  return {
    categories: initialCategories.map((item) => ({ ...item })),
    transactions: initialTransactions.map((item) => ({ ...item })),
    budgets: [
      { id: 'budget-1', categoryId: 'cat-food', limit: 500 },
      { id: 'budget-2', categoryId: 'cat-transport', limit: 120 },
      { id: 'budget-3', categoryId: 'cat-home', limit: 1200 },
      { id: 'budget-4', categoryId: 'cat-leisure', limit: 200 },
      { id: 'budget-5', categoryId: 'cat-study', limit: 300 },
      { id: 'budget-6', categoryId: 'cat-health', limit: 180 },
    ],
    goals: [
      { id: 'goal-1', name: 'Viaje de vacaciones', target: 3000, saved: 2040, dueDate: '2026-12-31' },
      { id: 'goal-2', name: 'Laptop nueva', target: 2500, saved: 850, dueDate: '2027-06-30' },
      { id: 'goal-3', name: 'Fondo de emergencia', target: 1500, saved: 1200, dueDate: '2027-03-31' },
      { id: 'goal-4', name: 'Curso de programación', target: 300, saved: 300, dueDate: '2026-09-15' },
    ],
    accounts: [
      { id: 'acc-cash', name: 'Efectivo', type: 'Efectivo', balance: 240 },
      { id: 'acc-bank', name: 'BCP Ahorros', type: 'Banco', balance: 7300 },
      { id: 'acc-card', name: 'Tarjeta Visa', type: 'Tarjeta', balance: 2300 },
    ],
    recurring: [
      { id: 'rec-1', name: 'Alquiler de departamento', type: 'expense', amount: 900, accountId: 'acc-bank', frequency: 'Mensual', nextDate: '2026-11-01', active: true },
      { id: 'rec-2', name: 'Netflix', type: 'expense', amount: 15.99, accountId: 'acc-card', frequency: 'Mensual', nextDate: '2026-10-24', active: true },
      { id: 'rec-3', name: 'Sueldo', type: 'income', amount: 3200, accountId: 'acc-bank', frequency: 'Mensual', nextDate: '2026-10-30', active: true },
      { id: 'rec-4', name: 'Seguro de salud', type: 'expense', amount: 480, accountId: 'acc-bank', frequency: 'Anual', nextDate: '2027-03-12', active: true },
      { id: 'rec-5', name: 'Gimnasio', type: 'expense', amount: 35, accountId: 'acc-card', frequency: 'Mensual', nextDate: '', active: false },
      { id: 'rec-6', name: 'Ahorro automático', type: 'expense', amount: 20, accountId: 'acc-bank', frequency: 'Semanal', nextDate: '2026-10-25', active: true },
    ],
    monthlyIncome: 8500,
    preferences: {
      currency: 'USD',
      language: 'Español',
      dateFormat: 'dd/mm/aaaa',
      budgetAlerts: true,
      recurringAlerts: true,
      fixedExpenseAlerts: true,
      weeklySummary: false,
    },
  }
}

// Cada perfil recibe copias independientes para evitar mezclar sus cambios.
function createInitialState() {
  const personal = createProfileData()
  const business = createProfileData()
  business.categories = business.categories.filter((category) => category.type === 'income' || category.name !== 'Vivienda')
  business.categories.push({ id: 'cat-business', name: 'Operaciones', type: 'expense', color: 'indigo', system: true })
  return { activeProfile: 'personal', profiles: { personal, empresarial: business } }
}

// Recupera el estado del navegador o vuelve a las semillas si no es valido.
function readState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return createInitialState()
    const parsed = JSON.parse(stored)
    if (!parsed?.profiles?.personal || !parsed?.profiles?.empresarial) {
      return createInitialState()
    }
    return parsed
  } catch {
    return createInitialState()
  }
}

export function FinanceProvider({ children }) {
  const [state, setState] = useState(readState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('No se pudieron guardar los datos demo en el navegador.', error)
    }
  }, [state])

  // Expone operaciones comunes para que cada pantalla actualice su perfil activo.
  const value = useMemo(() => {
    const data = state.profiles[state.activeProfile]
    function updateData(updater) {
      setState((current) => {
        const profile = current.activeProfile
        const nextData = updater(current.profiles[profile])
        return {
          ...current,
          profiles: { ...current.profiles, [profile]: nextData },
        }
      })
    }

    return {
      data,
      profile: state.activeProfile,
      setProfile: (profile) => setState((current) => ({ ...current, activeProfile: profile })),
      updateData,
      upsert: (collection, item) =>
        updateData((current) => {
          const exists = current[collection].some((entry) => entry.id === item.id)
          return {
            ...current,
            [collection]: exists
              ? current[collection].map((entry) => entry.id === item.id ? item : entry)
              : [item, ...current[collection]],
          }
        }),
      remove: (collection, id) =>
        updateData((current) => ({
          ...current,
          [collection]: current[collection].filter((entry) => entry.id !== id),
        })),
      setMonthlyIncome: (amount) => updateData((current) => ({ ...current, monthlyIncome: amount })),
      updatePreferences: (preferences) =>
        updateData((current) => ({
          ...current,
          preferences: { ...current.preferences, ...preferences },
        })),
    }
  }, [state])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

// The provider and its context hook intentionally live together.
// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) throw new Error('useFinance debe usarse dentro de FinanceProvider.')
  return context
}

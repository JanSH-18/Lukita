// Contexto financiero: guarda en el navegador los datos demo de cada usuario.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createDemoState, createEmptyState } from './financeSeed'
import { formatCurrency } from './financeUtils'

const STORAGE_PREFIX = 'lukita_finance_demo_v1'
const FinanceContext = createContext(null)

// Cada usuario usa su propia clave, asi dos cuentas no comparten datos.
const storageKeyFor = (userKey) =>
  `${STORAGE_PREFIX}:${String(userKey).trim().toLowerCase()}`

// Recupera lo guardado. Una cuenta nueva (o con datos invalidos) empieza vacia.
function readState(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return createEmptyState()
    const parsed = JSON.parse(stored)
    const hasProfiles = parsed?.profiles?.personal && parsed?.profiles?.empresarial
    return hasProfiles ? parsed : createEmptyState()
  } catch {
    return createEmptyState()
  }
}

export function FinanceProvider({ userKey, children }) {
  const storageKey = storageKeyFor(userKey)
  const [state, setState] = useState(() => readState(storageKey))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.error('No se pudieron guardar los datos demo en el navegador.', error)
    }
  }, [storageKey, state])

  // Operaciones comunes: cada pantalla modifica solo el perfil activo.
  const value = useMemo(() => {
    const data = state.profiles[state.activeProfile]

    function updateData(updater) {
      setState((current) => {
        const profile = current.activeProfile
        return {
          ...current,
          profiles: { ...current.profiles, [profile]: updater(current.profiles[profile]) },
        }
      })
    }

    return {
      data,
      profile: state.activeProfile,
      setProfile: (profile) =>
        setState((current) => ({ ...current, activeProfile: profile })),
      updateData,
      // Formatea montos con la moneda elegida en Configuracion.
      money: (amount) => formatCurrency(amount, data.preferences.currency),
      // Agrega el elemento al inicio o reemplaza el que tenga el mismo id.
      upsert: (collection, item) =>
        updateData((current) => {
          const exists = current[collection].some((entry) => entry.id === item.id)
          return {
            ...current,
            [collection]: exists
              ? current[collection].map((entry) => (entry.id === item.id ? item : entry))
              : [item, ...current[collection]],
          }
        }),
      remove: (collection, id) =>
        updateData((current) => ({
          ...current,
          [collection]: current[collection].filter((entry) => entry.id !== id),
        })),
      setMonthlyIncome: (amount) =>
        updateData((current) => ({ ...current, monthlyIncome: amount })),
      updatePreferences: (preferences) =>
        updateData((current) => ({
          ...current,
          preferences: { ...current.preferences, ...preferences },
        })),
      // Reemplaza los datos por los de ejemplo, o los deja en cero (se conserva el perfil activo).
      loadDemoData: () =>
        setState((current) => ({ ...createDemoState(), activeProfile: current.activeProfile })),
      clearData: () =>
        setState((current) => ({ ...createEmptyState(), activeProfile: current.activeProfile })),
    }
  }, [state])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

// El proveedor y su hook viven juntos a proposito.
// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) throw new Error('useFinance debe usarse dentro de FinanceProvider.')
  return context
}

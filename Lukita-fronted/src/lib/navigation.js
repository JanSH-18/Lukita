// Fuente unica de la navegacion del dashboard (escritorio y movil).
import {
  ArrowLeftRight,
  BarChart3,
  ChartPie,
  CircleDollarSign,
  CreditCard,
  Home,
  Repeat2,
  Settings,
  Tags,
  Target,
  Wallet,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Dashboard', to: '/app', icon: Home },
  { label: 'Mi dinero', to: '/app/mi-dinero', icon: Wallet },
  { label: 'Transacciones', to: '/app/transacciones', icon: ArrowLeftRight },
  { label: 'Gastos extras', to: '/app/gastos-extras', icon: CircleDollarSign },
  { label: 'Categorías', to: '/app/categorias', icon: Tags },
  { label: 'Presupuestos', to: '/app/presupuestos', icon: ChartPie },
  { label: 'Metas de ahorro', to: '/app/metas-de-ahorro', icon: Target },
  { label: 'Recurrentes', to: '/app/recurrentes', icon: Repeat2 },
  { label: 'Cuentas', to: '/app/cuentas', icon: CreditCard },
  { label: 'Reportes', to: '/app/reportes', icon: BarChart3 },
  { label: 'Configuración', to: '/app/configuracion', icon: Settings },
]

// En movil se muestran las rutas de uso frecuente; el resto queda en "Mas".
export const MOBILE_TABS = {
  left: [
    { label: 'Inicio', to: '/app', icon: Home },
    { label: 'Movimientos', to: '/app/transacciones', icon: ArrowLeftRight },
  ],
  right: { label: 'Presupuestos', to: '/app/presupuestos', icon: ChartPie },
}

export const MORE_PATH = '/app/mas'

export function isRouteActive(to, pathname) {
  return to === '/app' ? pathname === '/app' : pathname.startsWith(to)
}

export function routeTitle(pathname) {
  if (pathname === MORE_PATH) return 'Más opciones'
  const match = NAV_ITEMS.find(
    (item) => item.to !== '/app' && pathname.startsWith(item.to),
  )
  return match?.label ?? 'Dashboard'
}

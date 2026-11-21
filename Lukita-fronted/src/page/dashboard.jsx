// Zona privada: carga los datos del usuario y define las rutas de cada modulo.
import { Route, Routes } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { FinanceProvider } from '../lib/financeStore'
import {
  AccountsPage,
  BudgetsPage,
  CategoriesPage,
  ChatPage,
  ExtraExpensesPage,
  GoalsPage,
  MoneyPage,
  MorePage,
  RecibosPage,
  RecurringPage,
  ReportsPage,
  SettingsPage,
  TransactionsPage,
  VoicePage,
} from './finance'
import DashboardHome from './dashboardHome'

function DashboardRoutes({ session, onLogout }) {
  const account = { session, onLogout }

  return (
    // La clave por correo reinicia los datos si cambia el usuario.
    <FinanceProvider key={session.email} userKey={session.email}>
      <DashboardLayout session={session} onLogout={onLogout}>
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="voz" element={<VoicePage {...account} />} />
          <Route path="chat" element={<ChatPage {...account} />} />
          <Route path="recibos" element={<RecibosPage {...account} />} />
          <Route path="mi-dinero" element={<MoneyPage />} />
          <Route path="transacciones" element={<TransactionsPage {...account} />} />
          <Route path="gastos-extras" element={<ExtraExpensesPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="presupuestos" element={<BudgetsPage />} />
          <Route path="metas-de-ahorro" element={<GoalsPage />} />
          <Route path="recurrentes" element={<RecurringPage />} />
          <Route path="cuentas" element={<AccountsPage {...account} />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="configuracion" element={<SettingsPage {...account} />} />
          <Route path="mas" element={<MorePage {...account} />} />
        </Routes>
      </DashboardLayout>
    </FinanceProvider>
  )
}

export default DashboardRoutes

// Perfil, preferencias y navegacion a las demas secciones de la demo.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button, Card, Field, Notice, PageHeading, SelectField } from '../../components/FinanceUI'
import { useFinance } from '../../lib/financeStore'

export function SettingsPage({ session, onLogout }) {
  const { data, updatePreferences } = useFinance()
  const [name, setName] = useState(session?.name ?? '')
  const [notice, setNotice] = useState('')
  const preferences = data.preferences
  const toggles = [
    ['budgetAlerts', 'Alertas de presupuesto', 'Avisarme al llegar al 80% y al superar el 100%'],
    ['recurringAlerts', 'Recordatorios de pagos recurrentes', 'Avisarme antes de cada vencimiento'],
    ['fixedExpenseAlerts', 'Recordatorio mensual de gastos fijos', 'Avisarme a fin de mes para registrar mis gastos'],
    ['weeklySummary', 'Resumen semanal por correo', 'Recibir un resumen de mis movimientos'],
  ]
  return (
    <div className="space-y-5">
      <PageHeading title="Configuración" subtitle="Administra tu perfil, tu seguridad y tus preferencias" />
      {notice && <Notice tone="success">{notice}</Notice>}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Card><h2 className="mb-4 text-lg font-bold">Mi perfil</h2><div className="mb-5 flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-[#203c91]">{(name || session?.email || 'LU').slice(0, 2).toUpperCase()}</span><div><p className="font-bold">{name || session?.name || 'Usuario'}</p><Button variant="secondary" className="mt-2 min-h-8 px-3 text-xs" onClick={() => setNotice('La carga de foto estará disponible en una futura versión.')}>Cambiar foto</Button></div></div><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setNotice('Perfil demo actualizado para esta pantalla.') }}><Field label="Nombre completo" value={name} onChange={(event) => setName(event.target.value)} /><Field label="Correo electrónico" value={session?.email ?? ''} readOnly /><Button type="submit" className="w-full">Guardar cambios</Button></form></Card>
          <Card><h2 className="mb-2 text-lg font-bold">Seguridad</h2><p className="mb-4 text-sm text-slate-500">En esta demo no se modifica una contraseña real.</p><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setNotice('El cambio de contraseña requiere conectar una API.') }}><Field label="Contraseña actual" type="password" placeholder="••••••••••••" /><Field label="Nueva contraseña" type="password" placeholder="Mínimo 12 caracteres" /><Field label="Confirmar nueva contraseña" type="password" placeholder="Repite la nueva contraseña" /><Button type="submit" className="w-full">Actualizar contraseña</Button></form></Card>
        </div>
        <div className="space-y-5">
          <Card><h2 className="mb-4 text-lg font-bold">Preferencias</h2><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Moneda" defaultValue={preferences.currency} onChange={(event) => updatePreferences({ currency: event.target.value })} options={[{ value: 'USD', label: 'Dólar ($)' }, { value: 'PEN', label: 'Sol (S/)' }, { value: 'EUR', label: 'Euro (€)' }]} /><SelectField label="Idioma" defaultValue={preferences.language} onChange={(event) => updatePreferences({ language: event.target.value })} options={['Español', 'English'].map((value) => ({ value, label: value }))} /><SelectField className="sm:col-span-2" label="Formato de fecha" defaultValue={preferences.dateFormat} onChange={(event) => updatePreferences({ dateFormat: event.target.value })} options={['dd/mm/aaaa', 'mm/dd/aaaa', 'aaaa-mm-dd'].map((value) => ({ value, label: value }))} /></div></Card>
          <Card><h2 className="mb-4 text-lg font-bold">Notificaciones y alertas</h2><div className="space-y-4">{toggles.map(([key, title, description]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-slate-500">{description}</span></span><input type="checkbox" checked={preferences[key]} onChange={(event) => updatePreferences({ [key]: event.target.checked })} className="h-5 w-5 accent-[#203c91]" /></label>)}</div></Card>
          <Card className="bg-rose-50"><h2 className="text-lg font-bold">Sesión y cuenta</h2><p className="mt-2 text-sm text-slate-600">Cierra sesión en este equipo o elimina los datos demo almacenados en este navegador.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={onLogout}>Cerrar sesión</Button><Button variant="danger" onClick={() => { if (window.confirm('¿Borrar todos los datos financieros demo de este navegador?')) { localStorage.removeItem('lukita_finance_demo_v1'); setNotice('Se borrarán y restablecerán los datos demo al recargar la app.') } }}>Reiniciar datos demo</Button></div></Card>
        </div>
      </div>
    </div>
  )
}

export function MorePage({ session, onLogout }) {
  const { profile, setProfile } = useFinance()
  const items = [
    ['Mi dinero', '/app/mi-dinero', 'Administrar ingresos y egresos'],
    ['Gastos extras', '/app/gastos-extras', 'Controlar gastos ocasionales'],
    ['Categorías', '/app/categorias', 'Organizar movimientos'],
    ['Metas de ahorro', '/app/metas-de-ahorro', 'Seguir objetivos de ahorro'],
    ['Recurrentes', '/app/recurrentes', 'Pagos y cobros programados'],
    ['Cuentas', '/app/cuentas', 'Cuentas y perfiles'],
    ['Reportes', '/app/reportes', 'Resumen y exportación'],
    ['Configuración', '/app/configuracion', 'Perfil y preferencias'],
  ]
  return <div className="space-y-5"><PageHeading title="Más opciones" subtitle={session?.name || session?.email || 'Tu cuenta'} /><Card><button type="button" onClick={() => setProfile(profile === 'personal' ? 'empresarial' : 'personal')} className="mb-3 flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left"><span className="font-semibold">Perfil: {profile === 'personal' ? 'Personal' : 'Empresarial'}</span><span className="text-[#203c91]">Cambiar⌄</span></button><div className="divide-y divide-slate-100">{items.map(([label, to, description]) => <Link key={to} to={to} className="flex items-center justify-between gap-3 py-4"><span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-[#3154bb]">•</span><span><span className="block font-semibold">{label}</span><span className="block text-xs text-slate-500">{description}</span></span></span><ChevronRight className="h-5 w-5 text-slate-400" /></Link>)}</div></Card><Button variant="secondary" className="w-full" onClick={onLogout}>Cerrar sesión</Button></div>
}

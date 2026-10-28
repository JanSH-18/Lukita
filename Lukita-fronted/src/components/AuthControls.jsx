// Estilos y controles pequenos compartidos por login y registro.
import { Eye, EyeOff } from 'lucide-react'

export const inputClass =
  'w-full rounded-lg border border-[#e2e5ea] bg-[#f3f4f6] px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#2f4bb5] focus:bg-white focus:ring-2 focus:ring-[#2f4bb5]/20'

export function PasswordVisibilityIcon({ visible, className }) {
  const Icon = visible ? EyeOff : Eye
  return <Icon className={className} strokeWidth={1.8} aria-hidden="true" />
}

import { Check } from 'lucide-react'

function Brand({ size = 'default' }) {
  const isSmall = size === 'small'

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-[#ffb020] to-[#f29a0b] font-extrabold text-white shadow-lg shadow-black/10 ${
          isSmall ? 'h-10 w-10 text-lg' : 'h-12 w-12 text-2xl'
        }`}
      >
        L
      </span>
      <span
        className={`font-bold tracking-tight text-white ${
          isSmall ? 'text-xl' : 'text-2xl'
        }`}
      >
        Lukita
      </span>
    </div>
  )
}

const FEATURES = [
  'Control de ingresos y gastos en un solo lugar',
  'Presupuestos y metas de ahorro con seguimiento',
  'Reportes claros para decidir mejor',
]

function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="flex min-h-screen bg-[#f1f2f4]">
      <aside className="relative hidden w-[45%] overflow-hidden bg-gradient-to-b from-[#2a3c98] via-[#2c46ab] to-[#2f4bb5] px-12 py-10 text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -right-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-white/[0.07]" />
          <div className="absolute -left-24 bottom-[-6rem] h-72 w-72 rounded-full bg-[#5b68b8]/50" />
          <div className="absolute right-[8%] top-[58%] h-32 w-32 rounded-full bg-[#18a2b8]/80" />
        </div>

        <div className="relative">
          <Brand />
        </div>

        <div className="relative my-auto max-w-md py-12">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-blue-100/90">
            {subtitle}
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[#16205c]">
                  <Check
                    className="h-3.5 w-3.5"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm font-medium text-white/95">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="flex w-full items-center justify-center px-4 py-10 sm:px-8 lg:w-[55%]">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex justify-center lg:hidden">
            <div className="rounded-2xl bg-gradient-to-br from-[#2a3c98] to-[#2f4bb5] px-5 py-3">
              <Brand size="small" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] sm:p-8">
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout

const SUMMARY = [
  {
    label: 'Saldo total',
    value: '$0,00',
    accent: 'bg-[#eef2ff] text-[#1f2f7a]',
    hint: 'Disponible este mes',
  },
  {
    label: 'Ingresos',
    value: '$0,00',
    accent: 'bg-emerald-50 text-emerald-600',
    hint: 'Sin registros aún',
  },
  {
    label: 'Gastos',
    value: '$0,00',
    accent: 'bg-rose-50 text-rose-500',
    hint: 'Sin registros aún',
  },
]

function Dashboard({ session, onLogout }) {
  const displayName = session?.name?.trim() || session?.email || 'usuario'
  const firstName = displayName.split(' ')[0]
  const expiresAt = session?.exp
    ? new Intl.DateTimeFormat('es', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(session.exp * 1000))
    : null

  return (
    <div className="min-h-screen bg-[#f1f2f4]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffb020] to-[#f29a0b] text-lg font-extrabold text-white shadow">
              L
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Lukita
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">
              {displayName}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#1f3fa8]">
              Tu espacio financiero
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Hola, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Tu sesión está activa. Desde aquí puedes controlar tus ingresos,
              gastos, presupuestos y metas de ahorro.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Sesión activa
          </span>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {SUMMARY.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)]"
            >
              <span
                className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold ${item.accent}`}
              >
                {item.label}
              </span>
              <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
            </article>
          ))}
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)]">
            <h2 className="text-base font-semibold text-slate-900">
              Primeros pasos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aún no tienes movimientos registrados. Cuando agregues tus
              primeros ingresos y gastos verás aquí el resumen de tus finanzas.
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-0 rounded-full bg-[#1f2f7a]" />
            </div>
            <p className="mt-2 text-xs text-slate-400">0% completado</p>
          </article>

          <article className="rounded-2xl bg-gradient-to-br from-[#2a3c98] to-[#2f4bb5] p-6 text-white shadow-[0_18px_50px_-30px_rgba(31,47,122,0.65)]">
            <h2 className="text-base font-semibold">Sesión protegida</h2>
            <p className="mt-1 text-sm text-blue-100/90">
              El acceso a esta página requiere un token válido.
            </p>
            <dl className="mt-5 space-y-3 text-xs">
              <div>
                <dt className="text-blue-200/80">Cuenta</dt>
                <dd className="mt-0.5 truncate font-medium">{displayName}</dd>
              </div>
              {expiresAt && (
                <div>
                  <dt className="text-blue-200/80">Sesión válida hasta</dt>
                  <dd className="mt-0.5 font-medium">{expiresAt}</dd>
                </div>
              )}
            </dl>
            <button
              type="button"
              onClick={onLogout}
              className="mt-6 w-full rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              Cerrar sesión
            </button>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard

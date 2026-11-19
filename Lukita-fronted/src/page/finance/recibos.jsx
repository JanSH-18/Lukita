// Escanear boleta: unica pantalla (junto a voice.jsx y chat.jsx) que habla
// con el backend real. Sube/toma una foto, la manda a /recibos/analizar
// (vision-aula del lado del servidor) y deja confirmar/editar antes de
// crear la transaccion real via /transacciones.
import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Button, Card, Field, Notice, PageHeading, SelectField } from '../../components/FinanceUI'
import { apiFetch } from '../../lib/api'

function money(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value))
}

function formatFecha(value) {
  return new Date(value).toLocaleDateString('es-PE')
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

// De las lineas detectadas, la categoria que mas se repite (si alguna).
function categoriaMasFrecuente(lineas, idsValidos) {
  const conteo = new Map()
  for (const linea of lineas) {
    const id = linea.categoriaId
    if (!id || !idsValidos.has(String(id))) continue
    conteo.set(String(id), (conteo.get(String(id)) ?? 0) + 1)
  }
  let mejor = null
  let maxConteo = 0
  for (const [id, veces] of conteo) {
    if (veces > maxConteo) {
      mejor = id
      maxConteo = veces
    }
  }
  return mejor ?? ''
}

export function RecibosPage({ session }) {
  const [cargando, setCargando] = useState(true)
  const [perfilId, setPerfilId] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [recientes, setRecientes] = useState([])
  const [notice, setNotice] = useState(null)

  const [analizando, setAnalizando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [draft, setDraft] = useState(null)

  const fileInputRef = useRef(null)

  const categoriasDeGasto = categorias.filter((c) => c.tipo === 'gasto')

  async function cargarRecientes(pid) {
    const transacciones = await apiFetch(`/api/perfiles/${pid}/transacciones`, { token: session.token })
    setRecientes(transacciones.slice(0, 6))
  }

  useEffect(() => {
    let activo = true
    async function cargarTodo() {
      try {
        const perfiles = await apiFetch('/api/perfiles', { token: session.token })
        const perfil = perfiles[0]
        if (!perfil) throw new Error('Tu cuenta todavía no tiene un perfil configurado.')
        if (!activo) return
        setPerfilId(perfil.id)

        const [cuentasRes, categoriasRes, transaccionesRes] = await Promise.all([
          apiFetch(`/api/perfiles/${perfil.id}/cuentas`, { token: session.token }),
          apiFetch(`/api/perfiles/${perfil.id}/categorias`, { token: session.token }),
          apiFetch(`/api/perfiles/${perfil.id}/transacciones`, { token: session.token }),
        ])
        if (!activo) return
        setCuentas(cuentasRes)
        setCategorias(categoriasRes)
        setRecientes(transaccionesRes.slice(0, 6))
      } catch (error) {
        if (activo) setNotice({ tone: 'error', text: error.message ?? 'No se pudo conectar con el servidor.' })
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarTodo()
    return () => {
      activo = false
    }
  }, [session.token])

  async function analizarFoto(file) {
    setPreviewUrl(URL.createObjectURL(file))
    setDraft(null)
    setAnalizando(true)
    setNotice(null)
    try {
      const formData = new FormData()
      formData.append('foto', file)
      const resultado = await apiFetch(`/api/perfiles/${perfilId}/recibos/analizar`, {
        method: 'POST',
        token: session.token,
        body: formData,
        isFormData: true,
      })

      if (!resultado.legible) {
        setNotice({ tone: 'error', text: 'No se pudo leer la boleta; intenta con otra foto, con mejor luz.' })
        return
      }

      const idsValidos = new Set(categoriasDeGasto.map((c) => String(c.id)))
      setDraft({
        comercio: resultado.comercio ?? '',
        monto: resultado.total ?? '',
        fecha: resultado.fecha ?? hoyISO(),
        categoriaId: categoriaMasFrecuente(resultado.lineas ?? [], idsValidos),
        cuentaId: cuentas[0] ? String(cuentas[0].id) : '',
        lineas: resultado.lineas ?? [],
      })
    } catch (error) {
      setNotice({ tone: 'error', text: error.message ?? 'No se pudo analizar la foto.' })
    } finally {
      setAnalizando(false)
    }
  }

  function onFileChange(event) {
    const file = event.target.files?.[0]
    if (file) analizarFoto(file)
    event.target.value = ''
  }

  async function guardar(event) {
    event.preventDefault()
    if (!draft.cuentaId || !draft.categoriaId || !draft.monto) {
      setNotice({ tone: 'error', text: 'Completa cuenta, categoría y monto antes de guardar.' })
      return
    }
    setSaving(true)
    try {
      await apiFetch(`/api/perfiles/${perfilId}/transacciones`, {
        method: 'POST',
        token: session.token,
        body: {
          cuentaId: draft.cuentaId,
          categoriaId: draft.categoriaId,
          tipo: 'gasto',
          monto: Number(draft.monto),
          fecha: draft.fecha,
          descripcion: draft.comercio || undefined,
          esExtra: false,
        },
      })
      setDraft(null)
      setPreviewUrl(null)
      setNotice({ tone: 'success', text: 'Transacción guardada en tu cuenta.' })
      await cargarRecientes(perfilId)
    } catch (error) {
      setNotice({ tone: 'error', text: error.message ?? 'No se pudo guardar la transacción.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Escanear boleta"
        subtitle="Sube o toma una foto de tu boleta y Lukita la lee por ti"
      />

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando tu cuenta...</p>
        ) : (
          <>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Boleta seleccionada"
                className="max-h-48 rounded-xl border border-slate-200 object-contain"
              />
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={analizando || saving}
            >
              <Camera className="h-4 w-4" />
              {previewUrl ? 'Escanear otra boleta' : 'Escanear boleta'}
            </Button>

            {analizando && (
              <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin text-[#203c91]" />
                Leyendo la boleta...
              </p>
            )}
          </>
        )}
      </Card>

      {draft && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Revisa antes de guardar</h2>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Comercio"
                value={draft.comercio}
                onChange={(event) => setDraft((current) => ({ ...current, comercio: event.target.value }))}
              />
              <Field
                label="Monto (S/)"
                type="number"
                step="0.01"
                min="0"
                value={draft.monto}
                onChange={(event) => setDraft((current) => ({ ...current, monto: event.target.value }))}
              />
            </div>

            <Field
              label="Fecha"
              type="date"
              value={draft.fecha}
              onChange={(event) => setDraft((current) => ({ ...current, fecha: event.target.value }))}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Categoría"
                value={draft.categoriaId}
                onChange={(event) => setDraft((current) => ({ ...current, categoriaId: event.target.value }))}
                options={[
                  { value: '', label: 'Elige una categoría' },
                  ...categoriasDeGasto.map((c) => ({ value: String(c.id), label: c.nombre })),
                ]}
              />
              <SelectField
                label="Cuenta"
                value={draft.cuentaId}
                onChange={(event) => setDraft((current) => ({ ...current, cuentaId: event.target.value }))}
                options={cuentas.map((c) => ({ value: String(c.id), label: c.nombre }))}
              />
            </div>

            {draft.lineas.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Productos detectados</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {draft.lineas.map((linea, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="truncate text-slate-600">
                        {linea.cantidad ? `${linea.cantidad}× ` : ''}
                        {linea.descripcion ?? 'Producto'}
                      </span>
                      {linea.importe != null && (
                        <span className="shrink-0 font-medium">{money(linea.importe)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar transacción'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDraft(null)
                  setPreviewUrl(null)
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!cargando && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Movimientos recientes</h2>
          {recientes.length ? (
            <div className="divide-y divide-slate-100">
              {recientes.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.descripcion || item.categoria.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {item.categoria.nombre} · {item.cuenta.nombre} · {formatFecha(item.fecha)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-bold ${item.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}
                  >
                    {item.tipo === 'ingreso' ? '+' : '-'}
                    {money(item.monto)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Todavía no registras movimientos. Escanea tu primera boleta arriba.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

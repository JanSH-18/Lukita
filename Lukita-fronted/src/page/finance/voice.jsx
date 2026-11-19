// Asistente de voz: unica pantalla que habla con el backend real (Node/
// Express/Prisma) en vez del financeStore de demostracion. Graba un audio
// corto, lo manda a /voz (Groq Whisper + LLM del lado del servidor) y deja
// confirmar/editar antes de crear la transaccion real via /transacciones.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Square } from 'lucide-react'
import { Button, Card, Field, Notice, PageHeading, SelectField } from '../../components/FinanceUI'
import { apiFetch } from '../../lib/api'

const TIPOS = [
  { value: 'gasto', label: 'Gasto' },
  { value: 'ingreso', label: 'Ingreso' },
]

function money(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value))
}

function formatFecha(value) {
  return new Date(value).toLocaleDateString('es-PE')
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export function VoicePage({ session }) {
  const [cargando, setCargando] = useState(true)
  const [perfilId, setPerfilId] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [recientes, setRecientes] = useState([])
  const [notice, setNotice] = useState(null)

  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const cargarRecientes = useCallback(async (pid) => {
    const transacciones = await apiFetch(`/api/perfiles/${pid}/transacciones`, { token: session.token })
    setRecientes(transacciones.slice(0, 6))
  }, [session.token])

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

  async function enviarAudio(blob) {
    setProcessing(true)
    setNotice(null)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'audio.webm')
      const resultado = await apiFetch(`/api/perfiles/${perfilId}/voz`, {
        method: 'POST',
        token: session.token,
        body: formData,
        isFormData: true,
      })

      const tipo = resultado.tipo ?? 'gasto'
      const categoriaSugerida = categorias.some((c) => String(c.id) === String(resultado.categoriaId))
        ? String(resultado.categoriaId)
        : ''

      setDraft({
        transcripcion: resultado.transcripcion,
        monto: resultado.monto ?? '',
        descripcion: resultado.descripcion ?? '',
        tipo,
        categoriaId: categoriaSugerida,
        cuentaId: cuentas[0] ? String(cuentas[0].id) : '',
        fecha: resultado.fecha ?? hoyISO(),
      })
    } catch (error) {
      setNotice({ tone: 'error', text: error.message ?? 'No se pudo procesar el audio.' })
    } finally {
      setProcessing(false)
    }
  }

  async function startRecording() {
    setNotice(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        enviarAudio(blob)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      setNotice({
        tone: 'error',
        text: 'No se pudo acceder al micrófono. Revisa los permisos del navegador.',
      })
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
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
          tipo: draft.tipo,
          monto: Number(draft.monto),
          fecha: draft.fecha,
          descripcion: draft.descripcion || undefined,
          esExtra: false,
        },
      })
      setDraft(null)
      setNotice({ tone: 'success', text: 'Transacción guardada en tu cuenta.' })
      await cargarRecientes(perfilId)
    } catch (error) {
      setNotice({ tone: 'error', text: error.message ?? 'No se pudo guardar la transacción.' })
    } finally {
      setSaving(false)
    }
  }

  const categoriasDelTipo = categorias.filter((c) => c.tipo === draft?.tipo)

  return (
    <div className="space-y-5">
      <PageHeading
        title="Asistente de voz"
        subtitle={'Dile a Lukita lo que gastaste, por ejemplo: "gasté 25 soles en pollo a la brasa en Norky\'s"'}
      />

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        {cargando ? (
          <p className="text-sm text-slate-500">Cargando tu cuenta...</p>
        ) : (
          <>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={processing || saving}
              className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                recording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#203c91] hover:bg-[#172f7c]'
              }`}
            >
              {recording ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
            </button>
            <p className="text-sm font-medium text-slate-700">
              {processing
                ? 'Procesando audio...'
                : recording
                  ? 'Escuchando... toca para terminar'
                  : 'Toca para grabar un gasto'}
            </p>
            {processing && <Loader2 className="h-5 w-5 animate-spin text-[#203c91]" />}
          </>
        )}
      </Card>

      {draft && (
        <Card>
          <h2 className="mb-1 text-lg font-bold">Revisa antes de guardar</h2>
          <p className="mb-4 text-sm text-slate-500">Escuché: "{draft.transcripcion}"</p>
          <form onSubmit={guardar} className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold">Tipo</p>
              <div className="flex rounded-xl bg-slate-100 p-1">
                {TIPOS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, tipo: value, categoriaId: '' }))}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                      draft.tipo === value ? 'bg-[#203c91] text-white' : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Monto (S/)"
                type="number"
                step="0.01"
                min="0"
                value={draft.monto}
                onChange={(event) => setDraft((current) => ({ ...current, monto: event.target.value }))}
              />
              <Field
                label="Fecha"
                type="date"
                value={draft.fecha}
                onChange={(event) => setDraft((current) => ({ ...current, fecha: event.target.value }))}
              />
            </div>

            <Field
              label="Descripción"
              value={draft.descripcion}
              onChange={(event) => setDraft((current) => ({ ...current, descripcion: event.target.value }))}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Categoría"
                value={draft.categoriaId}
                onChange={(event) => setDraft((current) => ({ ...current, categoriaId: event.target.value }))}
                options={[
                  { value: '', label: 'Elige una categoría' },
                  ...categoriasDelTipo.map((c) => ({ value: String(c.id), label: c.nombre })),
                ]}
              />
              <SelectField
                label="Cuenta"
                value={draft.cuentaId}
                onChange={(event) => setDraft((current) => ({ ...current, cuentaId: event.target.value }))}
                options={cuentas.map((c) => ({ value: String(c.id), label: c.nombre }))}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar transacción'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setDraft(null)} disabled={saving}>
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
              Todavía no registras movimientos por voz. Graba el primero arriba.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

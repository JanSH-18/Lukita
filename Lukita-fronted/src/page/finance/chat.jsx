// "Pregúntale a Lukita": chat con tool-calling real (Groq + Prisma) y
// respuesta hablada. Igual que voice.jsx, habla con el backend real en vez
// del financeStore de demostracion.
import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Volume2 } from 'lucide-react'
import { Button, Card, Field, Notice, PageHeading } from '../../components/FinanceUI'
import { apiFetch, API_URL } from '../../lib/api'

const EJEMPLOS = [
  '¿En qué categoría gasté más este mes?',
  '¿Cuánto me queda de presupuesto en Alimentación este mes?',
  '¿Cuáles fueron mis gastos más grandes este mes?',
]

// Si Azure Speech no esta configurado (o falla), cae al speechSynthesis
// gratis del navegador -- el plan B que ya tenias contemplado.
async function reproducir(perfilId, token, texto) {
  try {
    const respuesta = await fetch(`${API_URL}/api/perfiles/${perfilId}/chat/hablar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    })
    if (!respuesta.ok) throw new Error('tts no disponible')
    const blob = await respuesta.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
  } catch {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(texto)
      utterance.lang = 'es-PE'
      window.speechSynthesis.speak(utterance)
    }
  }
}

export function ChatPage({ session }) {
  const [perfilId, setPerfilId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensajes, setMensajes] = useState([])
  const [pregunta, setPregunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [notice, setNotice] = useState(null)
  const finRef = useRef(null)

  useEffect(() => {
    let activo = true
    apiFetch('/api/perfiles', { token: session.token })
      .then((perfiles) => {
        if (!activo) return
        if (!perfiles[0]) throw new Error('Tu cuenta todavía no tiene un perfil configurado.')
        setPerfilId(perfiles[0].id)
      })
      .catch((error) => activo && setNotice({ tone: 'error', text: error.message }))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [session.token])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function preguntar(texto) {
    const limpio = texto.trim()
    if (!limpio || enviando || !perfilId) return

    setMensajes((actual) => [...actual, { role: 'user', texto: limpio }])
    setPregunta('')
    setEnviando(true)
    setNotice(null)

    try {
      const { respuesta } = await apiFetch(`/api/perfiles/${perfilId}/chat`, {
        method: 'POST',
        token: session.token,
        body: { pregunta: limpio },
      })
      setMensajes((actual) => [...actual, { role: 'assistant', texto: respuesta }])
      reproducir(perfilId, session.token, respuesta)
    } catch (error) {
      setNotice({ tone: 'error', text: error.message ?? 'No se pudo responder la pregunta.' })
    } finally {
      setEnviando(false)
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    preguntar(pregunta)
  }

  return (
    <div className="space-y-5">
      <PageHeading
        title="Pregúntale a Lukita"
        subtitle="Hazle una pregunta sobre tus finanzas y te responde con datos reales, en voz"
      />

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <Card className="flex h-[60vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {mensajes.length === 0 && !cargando && (
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Prueba con alguna de estas preguntas:</p>
              {EJEMPLOS.map((ejemplo) => (
                <button
                  key={ejemplo}
                  type="button"
                  onClick={() => preguntar(ejemplo)}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {ejemplo}
                </button>
              ))}
            </div>
          )}

          {mensajes.map((mensaje, index) => (
            <div
              key={index}
              className={`flex ${mensaje.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  mensaje.role === 'user'
                    ? 'bg-[#203c91] text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {mensaje.role === 'assistant' && (
                  <Volume2 className="mb-1 h-3.5 w-3.5 text-slate-400" />
                )}
                {mensaje.texto}
              </div>
            </div>
          ))}

          {enviando && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lukita está pensando...
            </div>
          )}
          <div ref={finRef} />
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <Field
            className="flex-1"
            placeholder={cargando ? 'Cargando tu cuenta...' : 'Escribe tu pregunta...'}
            value={pregunta}
            onChange={(event) => setPregunta(event.target.value)}
            disabled={cargando || enviando}
          />
          <Button type="submit" disabled={cargando || enviando || !pregunta.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}

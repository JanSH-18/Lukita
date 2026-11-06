// Controla un tooltip que aparece al pasar el cursor (o enfocar con teclado) sobre
// una parte de un grafico. Se usa junto con <ChartTooltip /> y un contenedor `relative`.
import { useCallback, useRef, useState } from 'react'

export function useChartTooltip() {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  // `lines` son los textos del tooltip (el primero se muestra en negrita).
  const show = useCallback((event, lines) => {
    const container = containerRef.current?.getBoundingClientRect()
    if (!container) return

    if (event.type === 'focus') {
      // Con teclado no hay cursor: el tooltip se ubica sobre el elemento enfocado.
      const target = event.currentTarget.getBoundingClientRect()
      setTooltip({
        x: target.left - container.left + target.width / 2,
        y: target.top - container.top,
        lines,
      })
    } else {
      setTooltip({ x: event.clientX - container.left, y: event.clientY - container.top, lines })
    }
  }, [])

  const hide = useCallback(() => setTooltip(null), [])

  return { containerRef, tooltip, show, hide }
}

// Globo con datos que sigue al cursor sobre un grafico. Ver useChartTooltip.
export function ChartTooltip({ tooltip }) {
  if (!tooltip) return null

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: tooltip.x, top: tooltip.y - 10 }}
    >
      {tooltip.lines.map((line, index) => (
        <p key={line} className={index === 0 ? 'font-semibold' : 'text-slate-200'}>
          {line}
        </p>
      ))}
    </div>
  )
}

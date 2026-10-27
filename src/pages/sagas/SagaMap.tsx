import type { Palette, SagaStage } from '../../api/types'

interface SagaMapProps {
  width: number
  height: number
  stages: SagaStage[]
  activeIndex: number
  palette: Palette
  reducedMotion: boolean
}

// Mapa persistente del Grand Line: SVG con las coordenadas que entrega la API.
export function SagaMap({ width, height, stages, activeIndex, palette, reducedMotion }: SagaMapProps) {
  const points = stages.map((s) => `${s.island.x},${s.island.y}`)
  const traveled = points.slice(0, activeIndex + 1).join(' ')
  const active = stages[activeIndex]
  const unit = Math.max(width, height) / 100
  const transition = reducedMotion ? 'none' : 'transform 700ms ease-in-out, fill 700ms'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={active ? `Mapa del Grand Line. El barco está en ${active.island.name}, etapa ${activeIndex + 1} de ${stages.length}.` : 'Mapa del Grand Line'}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width={width} height={height} rx={unit * 2} fill={palette.surface} />
      {/* olas decorativas */}
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${((i + 1) * height) / 7} q ${width / 8} ${-unit * 1.5} ${width / 4} 0 t ${width / 4} 0 t ${width / 4} 0 t ${width / 4} 0`}
          fill="none"
          stroke={palette.text}
          strokeOpacity={0.06}
          strokeWidth={unit * 0.4}
        />
      ))}
      {/* ruta completa (por recorrer) */}
      <polyline points={points.join(' ')} fill="none" stroke={palette.text} strokeOpacity={0.3} strokeWidth={unit * 0.5} strokeDasharray={`${unit * 1.5} ${unit * 1.5}`} />
      {/* ruta recorrida hasta la etapa activa */}
      <polyline points={traveled} fill="none" stroke={palette.primary} strokeWidth={unit * 0.9} strokeLinecap="round" strokeLinejoin="round" />
      {stages.map((stage, i) => {
        const visited = i <= activeIndex
        return (
          <g key={stage.id}>
            <circle cx={stage.island.x} cy={stage.island.y} r={unit * (i === activeIndex ? 2.6 : 1.8)} fill={visited ? palette.primary : palette.background} stroke={palette.text} strokeWidth={unit * 0.3} />
            <text
              x={stage.island.x}
              y={stage.island.y - unit * 3.5}
              textAnchor="middle"
              fontSize={unit * 2.6}
              fontWeight={i === activeIndex ? 800 : 500}
              fill={palette.text}
              opacity={visited ? 1 : 0.6}
            >
              {stage.island.name}
            </text>
          </g>
        )
      })}
      {active && (
        <g style={{ transform: `translate(${active.island.x}px, ${active.island.y + unit * 5}px)`, transition }}>
          <g transform={`scale(${unit / 2})`}>
            {/* barco */}
            <path d="M-6 0 L6 0 L4 3 L-4 3 Z" fill={palette.accent} stroke={palette.text} strokeWidth={0.4} />
            <path d="M0 0 L0 -8" stroke={palette.text} strokeWidth={0.6} />
            <path d="M0 -8 L5 -3 L0 -3 Z" fill={palette.text} />
          </g>
        </g>
      )}
    </svg>
  )
}

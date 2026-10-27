import { Link } from 'react-router'
import { getSagas } from '../../api/endpoints'
import type { SagaSummary } from '../../api/types'
import { EmptyState, ErrorState, PageHeader } from '../../components/ui'
import { formatNumber } from '../../lib/format'
import { transitionName } from '../../lib/motion'
import { useApi } from '../../lib/useApi'

export default function SagasPage() {
  const sagas = useApi('sagas', getSagas)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Poneglyph · La Gran Saga" subtitle="Elige una saga para recorrer su historia por el Grand Line." />
      {sagas.loading && (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />
          ))}
        </div>
      )}
      {sagas.error && <ErrorState error={sagas.error} onRetry={sagas.reload} />}
      {sagas.data && sagas.data.length === 0 && <EmptyState title="Aún no hay sagas disponibles" />}
      {sagas.data && sagas.data.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {sagas.data.map((saga) => (
            <SagaCard key={saga.id} saga={saga} />
          ))}
        </ul>
      )}
    </main>
  )
}

function SagaCard({ saga }: { saga: SagaSummary }) {
  const { palette } = saga
  return (
    <li>
      {/* viewTransition: usa la View Transition API si existe; si no, navegación normal */}
      <Link
        to={`/sagas/${encodeURIComponent(saga.id)}`}
        viewTransition
        className="block h-full rounded-2xl p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        style={{ backgroundColor: palette.background, color: palette.text }}
      >
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: palette.accent }}>
          Saga {saga.order}
        </p>
        <h2 className="mt-1 text-2xl font-black" style={{ viewTransitionName: transitionName('saga-title', saga.id) }}>
          {saga.title}
        </h2>
        <p className="mt-1 text-sm opacity-90">{saga.subtitle}</p>
        <p className="mt-3 text-sm opacity-80">{saga.synopsis}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full px-2 py-1" style={{ backgroundColor: palette.surface }}>{saga.stageCount} etapas</span>
          <span className="rounded-full px-2 py-1" style={{ backgroundColor: palette.surface }}>{formatNumber(saga.totalDistanceNm)} millas</span>
          <span className="rounded-full px-2 py-1" style={{ backgroundColor: palette.surface }}>{saga.firstIsland} → {saga.lastIsland}</span>
        </div>
        <div className="mt-4 flex gap-1" aria-hidden="true">
          {[palette.primary, palette.accent, palette.surface].map((color) => (
            <span key={color} className="h-2 flex-1 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>
      </Link>
    </li>
  )
}

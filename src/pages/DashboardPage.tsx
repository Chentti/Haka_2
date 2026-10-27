import { Link } from 'react-router'
import { getDashboardSummary, getLogPose } from '../api/endpoints'
import { FRUIT_FILTERS, WANTED_STATUSES } from '../api/types'
import type { DashboardSummary, LogPose } from '../api/types'
import { Badge, EmptyState, ErrorState, PageHeader } from '../components/ui'
import { formatBerries, formatBerriesCompact, formatDate, formatNumber } from '../lib/format'
import { FRUIT_LABEL, WANTED_STATUS_LABEL } from '../lib/labels'
import { useApi } from '../lib/useApi'

export default function DashboardPage() {
  const summary = useApi('dashboard', getDashboardSummary)
  const logPose = useApi('log-pose', getLogPose)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Dashboard de la tripulación" subtitle={summary.data ? `${summary.data.team.name} · ${summary.data.team.code}` : undefined} />

      <section aria-label="Estado del Log Pose" className="mb-6">
        {logPose.loading && <div className="h-24 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />}
        {logPose.error && <ErrorState error={logPose.error} onRetry={logPose.reload} title="No se pudo leer el Log Pose" />}
        {logPose.data && <LogPoseCard logPose={logPose.data} />}
      </section>

      {summary.loading && <DashboardSkeleton />}
      {summary.error && <ErrorState error={summary.error} onRetry={summary.reload} />}
      {summary.data && <SummaryView summary={summary.data} />}
    </main>
  )
}

function LogPoseCard({ logPose }: { logPose: LogPose }) {
  const unlocked = logPose.status === 'UNLOCKED'
  return (
    <div className={`rounded-xl border p-5 ${unlocked ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🧭</span>
        <h2 className="font-bold">Log Pose</h2>
        <Badge className={unlocked ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}>
          {unlocked ? 'Grand Line desbloqueado' : 'Bloqueado'}
        </Badge>
      </div>
      <p className="mt-2 text-sm">{logPose.message}</p>
      {logPose.unlockedAt && <p className="mt-1 text-xs text-slate-600">Obtenido: {formatDate(logPose.unlockedAt)}</p>}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
      ))}
      <div className="h-64 animate-pulse rounded-xl bg-slate-200 sm:col-span-2 lg:col-span-4 motion-reduce:animate-none" />
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function Bars({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-bold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.label} className="text-sm">
            <div className="flex justify-between">
              <span>{row.label}</span>
              <span className="font-semibold">{formatNumber(row.value)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-sky-600" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SummaryView({ summary }: { summary: DashboardSummary }) {
  const { wanted, crews, topBounties } = summary
  if (wanted.total === 0) {
    return (
      <EmptyState title="Aún no hay carteles en este workspace">
        Cuando la Guild publique carteles de "Se Busca", aquí verás sus indicadores.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Carteles" value={formatNumber(wanted.total)} />
        <Stat label="Recompensa total" value={formatBerriesCompact(wanted.totalBounty)} hint={formatBerries(wanted.totalBounty)} />
        <Stat label="Recompensa promedio" value={formatBerriesCompact(wanted.averageBounty)} hint={formatBerries(wanted.averageBounty)} />
        <Stat label="Tripulaciones" value={formatNumber(crews.total)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Bars title="Por estado" rows={WANTED_STATUSES.map((s) => ({ label: WANTED_STATUS_LABEL[s], value: wanted.byStatus[s] ?? 0 }))} />
        <Bars title="Por fruta del diablo" rows={FRUIT_FILTERS.map((f) => ({ label: FRUIT_LABEL[f], value: wanted.byFruit[f] ?? 0 }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 font-bold">Tripulación más buscada</h3>
          {crews.mostWanted ? (
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 shrink-0 rounded-full border" style={{ backgroundColor: crews.mostWanted.jollyRogerColor }} aria-hidden="true" />
              <div>
                <p className="font-semibold">{crews.mostWanted.name}</p>
                <p className="text-xs text-slate-500">
                  {crews.mostWanted.shipName} · {crews.mostWanted.memberCount} carteles · {formatBerries(crews.mostWanted.totalBounty)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sin datos.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
          <h3 className="mb-2 font-bold">Top recompensas</h3>
          <ol className="divide-y divide-slate-100">
            {topBounties.map((w, i) => (
              <li key={w.id}>
                <Link to={`/wanted/${encodeURIComponent(w.id)}`} className="flex items-center justify-between gap-3 py-2 hover:bg-slate-50">
                  <span className="min-w-0 truncate">
                    <span className="mr-2 font-bold text-slate-400">{i + 1}.</span>
                    <span className="font-semibold">{w.name}</span>
                    <span className="text-sm text-slate-500"> “{w.epithet}”</span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatBerries(w.bounty)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="text-xs text-slate-500">Actualizado: {formatDate(summary.generatedAt)}</p>
    </div>
  )
}

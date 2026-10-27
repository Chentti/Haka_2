import { useLocation, useNavigate, useParams } from 'react-router'
import { isRecord } from '../../api/client'
import { getWantedById } from '../../api/endpoints'
import type { WantedDetail } from '../../api/types'
import { Modal } from '../../components/Modal'
import { Badge, ErrorState, Spinner } from '../../components/ui'
import { formatBerries, formatDate } from '../../lib/format'
import { FRUIT_LABEL, ROLE_LABEL, WANTED_STATUS_LABEL, WANTED_STATUS_STYLE } from '../../lib/labels'
import { useApi } from '../../lib/useApi'

export default function WantedDetailRoute() {
  const { id = '' } = useParams()
  return <WantedDetailModal key={id} id={id} />
}

function WantedDetailModal({ id }: { id: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const detail = useApi(`wanted/${id}`, (signal) => getWantedById(id, signal))

  const close = () => {
    // Si venimos del listado, "atrás" lo deja exactamente como estaba.
    if (isRecord(location.state) && location.state.fromList === true) navigate(-1)
    else navigate({ pathname: '/wanted', search: location.search })
  }

  return (
    <Modal title={detail.data ? `Cartel de ${detail.data.name}` : 'Detalle del cartel'} onClose={close}>
      {detail.loading && <Spinner label="Cargando cartel…" />}
      {detail.error && <ErrorState error={detail.error} onRetry={detail.reload} />}
      {detail.data && <WantedDetailView wanted={detail.data} />}
    </Modal>
  )
}

function WantedDetailView({ wanted }: { wanted: WantedDetail }) {
  return (
    <article>
      <p className="text-xs font-bold tracking-widest text-amber-700 uppercase">Se busca · vivo o muerto</p>
      <h2 className="text-2xl font-black text-slate-900">{wanted.name}</h2>
      <p className="text-slate-600">“{wanted.epithet}”</p>
      <p className="mt-3 text-3xl font-black text-amber-700">{formatBerries(wanted.bounty)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge className={WANTED_STATUS_STYLE[wanted.status]}>{WANTED_STATUS_LABEL[wanted.status]}</Badge>
        <Badge className="bg-slate-100 text-slate-700">Amenaza {wanted.threatLevel}/5</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Item label="Tripulación" value={wanted.crew.name} />
        <Item label="Puesto" value={ROLE_LABEL[wanted.role] ?? wanted.role} />
        <Item label="Fruta del diablo" value={wanted.devilFruit ? `${wanted.devilFruit.name} (${FRUIT_LABEL[wanted.devilFruit.type]})` : 'Sin fruta'} />
        <Item label="Edad / Altura" value={`${wanted.age} años · ${wanted.heightCm} cm`} />
        <Item label="Visto por última vez" value={`${wanted.lastSeen.island} · ${formatDate(wanted.lastSeen.seenAt)}`} />
        <Item label="Actualizado" value={formatDate(wanted.updatedAt)} />
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{wanted.bio}</p>

      <h3 className="mt-5 font-bold">Historial de recompensas</h3>
      <ol className="mt-2 flex flex-col gap-1 text-sm">
        {wanted.bountyHistory.map((h) => (
          <li key={h.issuedAt} className="flex justify-between border-b border-slate-100 py-1">
            <span className="text-slate-600">{formatDate(h.issuedAt)}</span>
            <span className="font-semibold">{formatBerries(h.amount)}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500 uppercase">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  )
}

import { useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import { errorMessage, isRecord, toApiError } from '../../api/client'
import type { ApiError } from '../../api/client'
import { getNewsById, updateNewsStatus } from '../../api/endpoints'
import type { NewsDetail, VerifyTarget } from '../../api/types'
import { Modal } from '../../components/Modal'
import { Badge, ErrorState, Spinner } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { NEWS_STATUS_LABEL, NEWS_STATUS_STYLE, NEWS_TYPE_LABEL, PRIORITY_LABEL, PRIORITY_STYLE } from '../../lib/labels'
import { useApi } from '../../lib/useApi'
import type { NewsOutletContext } from './newsContext'

type VerifyState =
  | { phase: 'idle' }
  | { phase: 'pending'; target: VerifyTarget }
  | { phase: 'success'; target: VerifyTarget }
  | { phase: 'error'; target: VerifyTarget; error: ApiError; info?: string }

function currentFromConflict(error: ApiError): NewsDetail | null {
  if (!isRecord(error.body)) return null
  const current = error.body.current
  if (isRecord(current) && typeof current.id === 'string' && typeof current.status === 'string') {
    return current as unknown as NewsDetail
  }
  return null
}

export default function NewsDetailRoute() {
  const { id = '' } = useParams()
  return <NewsDetailModal key={id} id={id} />
}

function NewsDetailModal({ id }: { id: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { updateItem } = useOutletContext<NewsOutletContext>()
  const detail = useApi(`news/${id}`, (signal) => getNewsById(id, signal))
  const [override, setOverride] = useState<NewsDetail | null>(null)
  const [verify, setVerify] = useState<VerifyState>({ phase: 'idle' })
  const news = override ?? detail.data

  const close = () => {
    if (isRecord(location.state) && location.state.fromFeed === true) navigate(-1)
    else navigate({ pathname: '/news', search: location.search })
  }

  async function runVerify(target: VerifyTarget) {
    if (verify.phase === 'pending') return
    setVerify({ phase: 'pending', target })
    try {
      const updated = await updateNewsStatus(id, target)
      setOverride(updated)
      updateItem(updated) // el feed refleja el nuevo estado al volver
      setVerify({ phase: 'success', target })
    } catch (err) {
      const error = toApiError(err)
      const current = error.code === 'NEWS_ALREADY_VERIFIED' ? currentFromConflict(error) : null
      if (current) {
        // Otro miembro ya la verificó: mostramos el estado real.
        setOverride(current)
        updateItem(current)
        setVerify({ phase: 'error', target, error, info: `Ya estaba marcada como ${NEWS_STATUS_LABEL[current.status]}.` })
      } else {
        // Se conserva el estado anterior y se permite reintentar.
        setVerify({ phase: 'error', target, error })
      }
    }
  }

  return (
    <Modal title={news ? news.title : 'Detalle de la noticia'} onClose={close}>
      {!news && detail.loading && <Spinner label="Cargando noticia…" />}
      {!news && detail.error && <ErrorState error={detail.error} onRetry={detail.reload} />}
      {news && (
        <article>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-sky-100 text-sky-800">{NEWS_TYPE_LABEL[news.type]}</Badge>
            <Badge className={PRIORITY_STYLE[news.priority]}>Prioridad {PRIORITY_LABEL[news.priority]}</Badge>
            <Badge className={NEWS_STATUS_STYLE[news.status]}>{NEWS_STATUS_LABEL[news.status]}</Badge>
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-900">{news.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {news.island} · {news.source} · {formatDate(news.publishedAt)}
            {news.verifiedAt && ` · Verificada ${formatDate(news.verifiedAt)}`}
          </p>
          <div className="mt-4 flex flex-col gap-3 text-slate-700">
            {news.body.map((paragraph, i) => (
              <p key={i} className="leading-relaxed">{paragraph}</p>
            ))}
          </div>
          {news.relatedWanted && (
            <p className="mt-4 text-sm">
              Cartel relacionado:{' '}
              <Link to={`/wanted/${encodeURIComponent(news.relatedWanted.id)}`} className="font-semibold text-sky-700 underline">
                {news.relatedWanted.name}
              </Link>
            </p>
          )}

          <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-live="polite">
            <h3 className="font-bold">Verificación</h3>
            {news.status === 'RUMOR' ? (
              <>
                <p className="text-sm text-slate-600">Este rumor aún no se verifica. ¿Qué dicen tus fuentes?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <VerifyButton target="CONFIRMED" verify={verify} onClick={runVerify} className="bg-emerald-600 hover:bg-emerald-700" />
                  <VerifyButton target="DEBUNKED" verify={verify} onClick={runVerify} className="bg-slate-700 hover:bg-slate-800" />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">Estado final: {NEWS_STATUS_LABEL[news.status]}.</p>
            )}

            {verify.phase === 'success' && (
              <p role="status" className="mt-3 rounded-lg bg-emerald-100 p-3 text-sm font-semibold text-emerald-900">
                ✔ Noticia marcada como {NEWS_STATUS_LABEL[verify.target]}.
              </p>
            )}
            {verify.phase === 'error' && (
              <div role="alert" className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-900">
                <p>{verify.info ?? `No se pudo marcar como ${NEWS_STATUS_LABEL[verify.target]}. ${errorMessage(verify.error)}`}</p>
                {!verify.info && news.status === 'RUMOR' && (
                  <button
                    type="button"
                    onClick={() => void runVerify(verify.target)}
                    className="mt-2 rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white hover:bg-red-800"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            )}
          </section>
        </article>
      )}
    </Modal>
  )
}

function VerifyButton({
  target,
  verify,
  onClick,
  className,
}: {
  target: VerifyTarget
  verify: VerifyState
  onClick: (target: VerifyTarget) => Promise<void>
  className: string
}) {
  const pending = verify.phase === 'pending'
  const isThis = pending && verify.target === target
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onClick(target)}
      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {isThis ? 'Guardando…' : target === 'CONFIRMED' ? 'Confirmar' : 'Desmentir'}
    </button>
  )
}

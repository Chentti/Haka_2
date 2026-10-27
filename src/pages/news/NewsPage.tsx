import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useMatch, useSearchParams } from 'react-router'
import { errorMessage, toApiError } from '../../api/client'
import type { ApiError } from '../../api/client'
import { getNewsFeed } from '../../api/endpoints'
import { NEWS_PRIORITIES, NEWS_STATUSES, NEWS_TYPES, isOneOf } from '../../api/types'
import type { NewsItem } from '../../api/types'
import { Badge, EmptyState, ErrorState, PageHeader, SelectField, Spinner } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { NEWS_STATUS_LABEL, NEWS_STATUS_STYLE, NEWS_TYPE_LABEL, PRIORITY_LABEL, PRIORITY_STYLE } from '../../lib/labels'
import { newsFiltersToParams, parseNewsFilters } from '../../lib/newsFilters'
import type { NewsFilters } from '../../lib/newsFilters'
import type { NewsOutletContext } from './newsContext'

const PAGE_SIZE = 20

interface FeedState {
  key: string // filtros con los que se armó esta lista
  items: NewsItem[]
  nextCursor: string | null
  hasMore: boolean
  loading: boolean
  initialized: boolean
  error: ApiError | null
}

const emptyFeed = (key: string): FeedState => ({
  key,
  items: [],
  nextCursor: null,
  hasMore: true,
  loading: false,
  initialized: false,
  error: null,
})

const pickItem = (item: NewsItem): NewsItem => ({
  id: item.id,
  type: item.type,
  priority: item.priority,
  status: item.status,
  title: item.title,
  summary: item.summary,
  source: item.source,
  island: item.island,
  relatedWanted: item.relatedWanted,
  publishedAt: item.publishedAt,
  updatedAt: item.updatedAt,
  verifiedAt: item.verifiedAt,
})

export default function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseNewsFilters(searchParams)
  const filtersKey = newsFiltersToParams(filters).toString()
  const detailOpen = useMatch('/news/:id') !== null

  // URL inválida → forma válida
  useEffect(() => {
    if (searchParams.toString() !== filtersKey) setSearchParams(new URLSearchParams(filtersKey), { replace: true })
  }, [searchParams, filtersKey, setSearchParams])

  const [feed, setFeed] = useState<FeedState>(() => emptyFeed(filtersKey))
  if (feed.key !== filtersKey) {
    // Filtros nuevos: la lista anterior se descarta de inmediato (nunca se mezclan resultados).
    setFeed(emptyFeed(filtersKey))
  }
  const feedRef = useRef(feed)
  useLayoutEffect(() => {
    feedRef.current = feed
  })
  const inFlight = useRef<AbortController | null>(null)

  /** Pide una página. Nunca hay más de una carga en vuelo. */
  const fetchPage = useCallback((key: string, cursor: string | null) => {
    if (inFlight.current) return
    const controller = new AbortController()
    inFlight.current = controller
    setFeed((prev) => (prev.key === key ? { ...prev, loading: true, error: null } : prev))

    const params = parseNewsFilters(new URLSearchParams(key))
    getNewsFeed({ ...params, cursor, limit: PAGE_SIZE }, controller.signal)
      .then(
        (res) => {
          if (controller.signal.aborted) return
          setFeed((prev) => {
            if (prev.key !== key) return prev // respuesta de otros filtros: se descarta
            const seen = new Set(prev.items.map((i) => i.id))
            const fresh = res.items.filter((i) => {
              if (seen.has(i.id)) return false // Regla de Nami: nada se cuenta dos veces
              seen.add(i.id)
              return true
            })
            return {
              ...prev,
              items: [...prev.items, ...fresh],
              nextCursor: res.nextCursor,
              hasMore: res.hasMore && res.nextCursor !== null,
              loading: false,
              initialized: true,
            }
          })
        },
        (err: unknown) => {
          if (controller.signal.aborted) return
          // Las noticias ya cargadas se conservan; solo se marca el error.
          setFeed((prev) => (prev.key === key ? { ...prev, loading: false, error: toApiError(err) } : prev))
        },
      )
      .finally(() => {
        if (inFlight.current === controller) inFlight.current = null
      })
  }, [])

  // Cambio de filtros: se cancela lo que esté en vuelo y se empieza de cero sin cursor.
  useEffect(() => {
    inFlight.current?.abort()
    inFlight.current = null
    fetchPage(filtersKey, null)
    return () => {
      inFlight.current?.abort()
      inFlight.current = null
    }
  }, [filtersKey, fetchPage])

  const loadMore = useCallback(() => {
    const f = feedRef.current
    if (!f.initialized || !f.hasMore || f.loading || f.error) return
    fetchPage(f.key, f.nextCursor)
  }, [fetchPage])

  const retry = useCallback(() => {
    const f = feedRef.current
    fetchPage(f.key, f.initialized ? f.nextCursor : null)
  }, [fetchPage])

  // Infinite scroll: un "centinela" al final de la lista.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [sentinelVisible, setSentinelVisible] = useState(false)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => setSentinelVisible(entries[0]?.isIntersecting ?? false), {
      rootMargin: '0px 0px 400px 0px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Si el centinela sigue visible después de cargar (lista corta), se pide la siguiente.
  useEffect(() => {
    if (sentinelVisible && !detailOpen) loadMore()
  }, [sentinelVisible, detailOpen, feed.items.length, feed.loading, loadMore])

  const updateItem = useCallback((item: NewsItem) => {
    setFeed((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === item.id ? pickItem(item) : i)),
    }))
  }, [])

  const setFilter = (patch: NewsFilters) => setSearchParams(newsFiltersToParams({ ...filters, ...patch }))
  const hasFilters = Boolean(filters.type || filters.priority || filters.status)
  const outletContext: NewsOutletContext = { updateItem }

  const showInitialError = feed.error && feed.items.length === 0
  const lockedOrFatal = showInitialError && feed.error

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title="News Coo · Noticias del mundo" subtitle="Las noticias llegan solas mientras bajas." />

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <SelectField label="Tipo" value={filters.type ?? ''} onChange={(v) => setFilter({ type: isOneOf(NEWS_TYPES, v) ? v : undefined })}>
          <option value="">Todos</option>
          {NEWS_TYPES.map((t) => (
            <option key={t} value={t}>{NEWS_TYPE_LABEL[t]}</option>
          ))}
        </SelectField>
        <SelectField label="Prioridad" value={filters.priority ?? ''} onChange={(v) => setFilter({ priority: isOneOf(NEWS_PRIORITIES, v) ? v : undefined })}>
          <option value="">Todas</option>
          {NEWS_PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
          ))}
        </SelectField>
        <SelectField label="Estado" value={filters.status ?? ''} onChange={(v) => setFilter({ status: isOneOf(NEWS_STATUSES, v) ? v : undefined })}>
          <option value="">Todos</option>
          {NEWS_STATUSES.map((s) => (
            <option key={s} value={s}>{NEWS_STATUS_LABEL[s]}</option>
          ))}
        </SelectField>
        <div className="flex items-end">
          {hasFilters && (
            <button
              type="button"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {lockedOrFatal ? (
        <ErrorState error={lockedOrFatal} onRetry={retry} />
      ) : (
        <>
          {!feed.initialized && feed.loading && (
            <ul className="flex flex-col gap-3" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="h-32 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
              ))}
            </ul>
          )}

          {feed.initialized && feed.items.length === 0 && !feed.error && (
            <EmptyState title="No hay noticias con estos filtros" />
          )}

          <ul className="flex flex-col gap-3">
            {feed.items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </ul>

          {feed.initialized && feed.loading && (
            <div className="py-6 text-center">
              <Spinner label="Cargando más noticias…" />
            </div>
          )}

          {feed.error && feed.items.length > 0 && (
            <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p>No se pudieron cargar más noticias. {errorMessage(feed.error)}</p>
              <button type="button" onClick={retry} className="mt-2 rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white hover:bg-red-800">
                Reintentar
              </button>
            </div>
          )}

          {feed.initialized && !feed.hasMore && feed.items.length > 0 && (
            <p className="py-8 text-center text-sm text-slate-500">— Fin del feed: no hay más noticias —</p>
          )}
        </>
      )}

      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {/* /news/:id se abre encima: el feed no se desmonta, conserva posición y noticias */}
      <Outlet context={outletContext} />
    </main>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const location = useLocation()
  return (
    <li>
      <Link
        to={{ pathname: `/news/${encodeURIComponent(item.id)}`, search: location.search }}
        state={{ fromFeed: true }}
        className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-400 hover:shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-sky-100 text-sky-800">{NEWS_TYPE_LABEL[item.type]}</Badge>
          <Badge className={PRIORITY_STYLE[item.priority]}>Prioridad {PRIORITY_LABEL[item.priority]}</Badge>
          <Badge className={NEWS_STATUS_STYLE[item.status]}>{NEWS_STATUS_LABEL[item.status]}</Badge>
        </div>
        <h2 className="mt-2 font-bold text-slate-900">{item.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
        <p className="mt-2 text-xs text-slate-500">
          {item.island} · {item.source} · {formatDate(item.publishedAt)}
        </p>
      </Link>
    </li>
  )
}

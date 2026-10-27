import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useSearchParams } from 'react-router'
import { getCrews, getWanted } from '../../api/endpoints'
import { FRUIT_FILTERS, WANTED_SIZES, WANTED_SORTS, WANTED_STATUSES, isOneOf } from '../../api/types'
import type { WantedPage as WantedPageData, WantedSize, WantedSummary } from '../../api/types'
import { Badge, EmptyState, ErrorState, PageHeader, SelectField } from '../../components/ui'
import { formatBerries } from '../../lib/format'
import { FRUIT_LABEL, ROLE_LABEL, SORT_LABEL, WANTED_STATUS_LABEL, WANTED_STATUS_STYLE } from '../../lib/labels'
import { useApi } from '../../lib/useApi'
import { parseWantedQuery, wantedQueryToParams } from '../../lib/wantedQuery'
import type { WantedQuery } from '../../lib/wantedQuery'

const ROW_HEIGHT = 88 // px por fila (incluye separación): mantiene la altura estable
const SEARCH_DEBOUNCE_MS = 400

export default function WantedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = parseWantedQuery(searchParams)
  const queryKey = wantedQueryToParams(query).toString()

  // 1) URL con valores inválidos o en otro orden → se reemplaza por su forma válida.
  useEffect(() => {
    if (searchParams.toString() !== queryKey) setSearchParams(new URLSearchParams(queryKey), { replace: true })
  }, [searchParams, queryKey, setSearchParams])

  // Cambia la URL (estado completo de la vista). Cambiar filtros/búsqueda/orden/tamaño vuelve a la página 0.
  const updateQuery = useCallback(
    (patch: Partial<WantedQuery>, options?: { replace?: boolean }) => {
      setSearchParams(
        (prev) => {
          const current = parseWantedQuery(prev)
          const resetsPage = Object.keys(patch).some((k) => k !== 'page')
          return wantedQueryToParams({ ...current, ...patch, page: resetsPage ? 0 : (patch.page ?? current.page) })
        },
        { replace: options?.replace },
      )
    },
    [setSearchParams],
  )

  // 2) Datos: la key es la URL canónica. Si cambia, la request vieja se cancela y su respuesta se ignora.
  const wanted = useApi<WantedPageData>(`wanted?${queryKey}`, (signal) => getWanted(query, signal))
  const crews = useApi('crews', getCrews)

  // 3) Página que ya no existe → ir a la última página válida.
  const data = wanted.data
  useEffect(() => {
    if (!data) return
    const lastPage = Math.max(data.totalPages - 1, 0)
    if (query.page > lastPage) updateQuery({ page: lastPage }, { replace: true })
  }, [data, query.page, updateQuery])

  // 4) Búsqueda con debounce: una sola request cuando el usuario deja de escribir.
  const urlQ = query.q ?? ''
  const [searchInput, setSearchInput] = useState(urlQ)
  const [syncedQ, setSyncedQ] = useState(urlQ)
  if (urlQ !== syncedQ) {
    // la URL cambió desde afuera (atrás/adelante, limpiar): reflejarlo en el input
    setSyncedQ(urlQ)
    setSearchInput(urlQ)
  }
  useEffect(() => {
    const next = searchInput.trim().slice(0, 100)
    if (next === urlQ) return
    const timer = window.setTimeout(() => updateQuery({ q: next || undefined }), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, urlQ, updateQuery])

  // Altura reservada para que loading / error / vacío no muevan el layout.
  const [reservedRows, setReservedRows] = useState(10)
  if (data && data.content.length > 0 && data.content.length !== reservedRows) setReservedRows(data.content.length)
  const reservedHeight = reservedRows * ROW_HEIGHT

  const hasFilters = Boolean(query.q || query.status || query.crewId || query.fruit)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title='Carteles de "Se Busca"' subtitle="Filtra, busca y ordena los carteles de la Guild." />

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">
          Buscar por nombre o epíteto
          <input
            type="search"
            value={searchInput}
            maxLength={100}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ej. Ramón, el Sombrío…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
          />
        </label>
        <SelectField label="Estado" value={query.status ?? ''} onChange={(v) => updateQuery({ status: isOneOf(WANTED_STATUSES, v) ? v : undefined })}>
          <option value="">Todos</option>
          {WANTED_STATUSES.map((s) => (
            <option key={s} value={s}>{WANTED_STATUS_LABEL[s]}</option>
          ))}
        </SelectField>
        <SelectField label="Tripulación" value={query.crewId ?? ''} disabled={!crews.data} onChange={(v) => updateQuery({ crewId: v || undefined })}>
          <option value="">{crews.loading ? 'Cargando…' : crews.error ? 'No disponible' : 'Todas'}</option>
          {query.crewId && crews.data && !crews.data.some((c) => c.id === query.crewId) && (
            <option value={query.crewId}>Tripulación desconocida</option>
          )}
          {crews.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <SelectField label="Fruta del diablo" value={query.fruit ?? ''} onChange={(v) => updateQuery({ fruit: isOneOf(FRUIT_FILTERS, v) ? v : undefined })}>
          <option value="">Todas</option>
          {FRUIT_FILTERS.map((f) => (
            <option key={f} value={f}>{FRUIT_LABEL[f]}</option>
          ))}
        </SelectField>
        <SelectField label="Ordenar" value={query.sort} onChange={(v) => isOneOf(WANTED_SORTS, v) && updateQuery({ sort: v })}>
          {WANTED_SORTS.map((s) => (
            <option key={s} value={s}>{SORT_LABEL[s]}</option>
          ))}
        </SelectField>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <SelectField
            label="Por página"
            value={String(query.size)}
            onChange={(v) => {
              const n = Number(v)
              if ((WANTED_SIZES as readonly number[]).includes(n)) updateQuery({ size: n as WantedSize })
            }}
          >
            {WANTED_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>
          {hasFilters && (
            <button
              type="button"
              onClick={() => updateQuery({ q: undefined, status: undefined, crewId: undefined, fruit: undefined })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Limpiar filtros
            </button>
          )}
          <p className="ml-auto text-sm text-slate-600" aria-live="polite">
            {data ? `${data.totalElements} carteles` : wanted.loading ? 'Buscando…' : ''}
          </p>
        </div>
      </div>

      <section aria-busy={wanted.loading} style={{ minHeight: reservedHeight }}>
        {wanted.loading && <SkeletonRows count={reservedRows} />}
        {wanted.error && <ErrorState error={wanted.error} onRetry={wanted.reload} />}
        {data && data.content.length === 0 && query.page < Math.max(data.totalPages, 1) && (
          <EmptyState title="Sin resultados">
            Ningún cartel coincide con estos filtros.{' '}
            {hasFilters && 'Prueba con otra búsqueda o limpia los filtros.'}
          </EmptyState>
        )}
        {data && data.content.length > 0 && <WantedList items={data.content} />}
      </section>

      <Pagination
        page={query.page}
        totalPages={data?.totalPages ?? 0}
        disabled={wanted.loading}
        onChange={(page) => updateQuery({ page })}
      />

      {/* /wanted/:id se abre encima: el listado sigue montado y queda exactamente como estaba */}
      <Outlet />
    </main>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-20 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
      ))}
    </ul>
  )
}

function WantedList({ items }: { items: WantedSummary[] }) {
  const location = useLocation()
  return (
    <ul className="flex flex-col gap-2">
      {items.map((w) => (
        <li key={w.id}>
          <Link
            to={{ pathname: `/wanted/${encodeURIComponent(w.id)}`, search: location.search }}
            state={{ fromList: true }}
            className="flex h-20 items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 hover:border-sky-400 hover:shadow-sm"
          >
            <div
              className="hidden h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-100 text-amber-800 sm:flex"
              title={`Nivel de amenaza ${w.threatLevel} de 5`}
            >
              <span className="text-lg leading-none font-black">{w.threatLevel}</span>
              <span className="text-[10px] font-semibold">amenaza</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900">
                {w.name} <span className="font-normal text-slate-500">“{w.epithet}”</span>
              </p>
              <p className="truncate text-xs text-slate-600">
                {w.crew.name} · {ROLE_LABEL[w.role] ?? w.role} · {w.devilFruit ? `${w.devilFruit.name} (${FRUIT_LABEL[w.devilFruit.type]})` : 'Sin fruta'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-bold text-slate-900">{formatBerries(w.bounty)}</span>
              <Badge className={WANTED_STATUS_STYLE[w.status]}>{WANTED_STATUS_LABEL[w.status]}</Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Pagination({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number
  totalPages: number
  disabled: boolean
  onChange: (page: number) => void
}) {
  const shown = totalPages > 0 ? Math.min(page, totalPages - 1) : 0
  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-2">
      <button
        type="button"
        disabled={disabled || shown <= 0}
        onClick={() => onChange(shown - 1)}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        ← Anterior
      </button>
      <span className="text-sm text-slate-600">
        Página {totalPages > 0 ? shown + 1 : 0} de {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || shown >= totalPages - 1}
        onClick={() => onChange(shown + 1)}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Siguiente →
      </button>
    </nav>
  )
}

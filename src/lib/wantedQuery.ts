import { FRUIT_FILTERS, WANTED_SIZES, WANTED_SORTS, WANTED_STATUSES, isOneOf } from '../api/types'
import type { FruitFilter, WantedSize, WantedSort, WantedStatus } from '../api/types'

// Todo el estado de /wanted vive en la URL. Esta es su forma validada.
export interface WantedQuery {
  page: number
  size: WantedSize
  sort: WantedSort
  status?: WantedStatus
  crewId?: string
  fruit?: FruitFilter
  q?: string
}

export const DEFAULT_WANTED_SIZE: WantedSize = 20
export const DEFAULT_WANTED_SORT: WantedSort = 'bounty,desc'

/** Lee la URL; cualquier valor inválido se reemplaza por su valor por defecto. */
export function parseWantedQuery(sp: URLSearchParams): WantedQuery {
  const pageRaw = sp.get('page')
  const page = pageRaw !== null && /^\d{1,6}$/.test(pageRaw) ? Number(pageRaw) : 0

  const sizeNum = Number(sp.get('size'))
  const size = (WANTED_SIZES as readonly number[]).includes(sizeNum)
    ? (sizeNum as WantedSize)
    : DEFAULT_WANTED_SIZE

  const sortRaw = sp.get('sort')
  const statusRaw = sp.get('status')
  const fruitRaw = sp.get('fruit')
  const crewRaw = sp.get('crewId')?.trim()
  const qRaw = sp.get('q')?.trim()

  return {
    page,
    size,
    sort: isOneOf(WANTED_SORTS, sortRaw) ? sortRaw : DEFAULT_WANTED_SORT,
    status: isOneOf(WANTED_STATUSES, statusRaw) ? statusRaw : undefined,
    fruit: isOneOf(FRUIT_FILTERS, fruitRaw) ? fruitRaw : undefined,
    crewId: crewRaw && crewRaw.length <= 200 ? crewRaw : undefined,
    q: qRaw ? qRaw.slice(0, 100) : undefined,
  }
}

/** Forma canónica en la URL (orden fijo, sin valores por defecto). */
export function wantedQueryToParams(query: WantedQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.status) params.set('status', query.status)
  if (query.crewId) params.set('crewId', query.crewId)
  if (query.fruit) params.set('fruit', query.fruit)
  if (query.sort !== DEFAULT_WANTED_SORT) params.set('sort', query.sort)
  if (query.size !== DEFAULT_WANTED_SIZE) params.set('size', String(query.size))
  if (query.page > 0) params.set('page', String(query.page))
  return params
}

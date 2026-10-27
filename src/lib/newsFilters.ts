import { NEWS_PRIORITIES, NEWS_STATUSES, NEWS_TYPES, isOneOf } from '../api/types'
import type { NewsPriority, NewsStatus, NewsType } from '../api/types'

export interface NewsFilters {
  type?: NewsType
  priority?: NewsPriority
  status?: NewsStatus
}

export function parseNewsFilters(sp: URLSearchParams): NewsFilters {
  const type = sp.get('type')
  const priority = sp.get('priority')
  const status = sp.get('status')
  return {
    type: isOneOf(NEWS_TYPES, type) ? type : undefined,
    priority: isOneOf(NEWS_PRIORITIES, priority) ? priority : undefined,
    status: isOneOf(NEWS_STATUSES, status) ? status : undefined,
  }
}

export function newsFiltersToParams(filters: NewsFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.status) params.set('status', filters.status)
  return params
}

import { api } from './client'
import type {
  Crew,
  DashboardSummary,
  LoginRequest,
  LoginResponse,
  LogPose,
  MeResponse,
  NewsDetail,
  NewsFeed,
  RegisterRequest,
  SagaStory,
  SagaSummary,
  VerifyTarget,
  WantedDetail,
  WantedPage,
} from './types'
import type { WantedQuery } from '../lib/wantedQuery'
import type { NewsFilters } from '../lib/newsFilters'

const path = (id: string) => encodeURIComponent(id)

export const authApi = {
  login: (body: LoginRequest) => api<LoginResponse>('/auth/login', { method: 'POST', body }),
  register: (body: RegisterRequest) => api<LoginResponse>('/auth/register', { method: 'POST', body }),
  me: (signal?: AbortSignal) => api<MeResponse>('/auth/me', { signal }),
}

export const getDashboardSummary = (signal?: AbortSignal) =>
  api<DashboardSummary>('/dashboard/summary', { signal })

export const getLogPose = (signal?: AbortSignal) => api<LogPose>('/log-pose', { signal })

// Las tripulaciones no cambian durante la sesión: se piden una sola vez.
let crewsCache: Crew[] | null = null
export async function getCrews(signal?: AbortSignal): Promise<Crew[]> {
  if (crewsCache) return crewsCache
  const crews = await api<Crew[]>('/crews', { signal })
  crewsCache = crews
  return crews
}

/** Se llama al iniciar o cerrar sesión: cada equipo tiene su propio workspace. */
export function resetCaches(): void {
  crewsCache = null
}

export const getWanted = (query: WantedQuery, signal?: AbortSignal) =>
  api<WantedPage>('/wanted', {
    signal,
    query: {
      page: query.page,
      size: query.size,
      sort: query.sort,
      status: query.status,
      crewId: query.crewId,
      fruit: query.fruit,
      q: query.q,
    },
  })

export const getWantedById = (id: string, signal?: AbortSignal) =>
  api<WantedDetail>(`/wanted/${path(id)}`, { signal })

export const getNewsFeed = (
  params: NewsFilters & { cursor: string | null; limit: number },
  signal?: AbortSignal,
) =>
  api<NewsFeed>('/news/feed', {
    signal,
    query: {
      cursor: params.cursor,
      limit: params.limit,
      type: params.type,
      priority: params.priority,
      status: params.status,
    },
  })

export const getNewsById = (id: string, signal?: AbortSignal) =>
  api<NewsDetail>(`/news/${path(id)}`, { signal })

export const updateNewsStatus = (id: string, status: VerifyTarget) =>
  api<NewsDetail>(`/news/${path(id)}/status`, { method: 'PATCH', body: { status } })

export const getSagas = (signal?: AbortSignal) => api<SagaSummary[]>('/sagas', { signal })

export const getSagaStory = (id: string, signal?: AbortSignal) =>
  api<SagaStory>(`/sagas/${path(id)}/story`, { signal })

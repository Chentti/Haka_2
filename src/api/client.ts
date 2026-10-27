// Único punto de contacto con el backend: URL base, token, errores y 401.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const TOKEN_KEY = 'logpose_token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* sin almacenamiento disponible */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* sin almacenamiento disponible */
    }
  },
}

export interface FieldIssue {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: FieldIssue[]
  readonly retryAfterSeconds: number | null
  readonly body: unknown

  constructor(
    status: number,
    code: string,
    message: string,
    details: FieldIssue[] = [],
    retryAfterSeconds: number | null = null,
    body: unknown = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.retryAfterSeconds = retryAfterSeconds
    this.body = body
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFieldIssue(value: unknown): value is FieldIssue {
  return isRecord(value) && typeof value.field === 'string' && typeof value.message === 'string'
}

function parseError(status: number, data: unknown, retryHeader: string | null): ApiError {
  let code = status >= 500 ? 'INTERNAL_ERROR' : `HTTP_${status}`
  let message = `Error ${status}`
  let details: FieldIssue[] = []
  let retryAfter: number | null = retryHeader ? Number(retryHeader) || null : null
  if (isRecord(data)) {
    if (typeof data.code === 'string') code = data.code
    if (typeof data.message === 'string' && data.message) message = data.message
    if (Array.isArray(data.details)) details = data.details.filter(isFieldIssue)
    if (typeof data.retryAfterSeconds === 'number') retryAfter = data.retryAfterSeconds
  }
  return new ApiError(status, code, message, details, retryAfter, data)
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  return new ApiError(
    0,
    'NETWORK_ERROR',
    'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  )
}

/** Mensaje listo para mostrar al usuario. */
export function errorMessage(err: ApiError): string {
  if (err.status === 0) return err.message
  if (err.status === 429) {
    const wait = err.retryAfterSeconds ? ` Espera ${err.retryAfterSeconds} s y` : ''
    return `Demasiadas solicitudes seguidas.${wait} vuelve a intentarlo.`
  }
  if (err.status >= 500) return 'El servidor no respondió correctamente. Inténtalo de nuevo.'
  return err.message
}

// El AuthProvider registra aquí qué hacer cuando la sesión deja de ser válida.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  query?: Record<string, QueryValue>
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let url = `${BASE_URL}${path}`
  if (options.query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null || value === '') continue
      params.set(key, String(value))
    }
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (err) {
    if (isAbortError(err)) throw err
    throw toApiError(err)
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const error = parseError(res.status, data, res.headers.get('Retry-After'))
    const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/register')
    if (res.status === 401 && token && !isAuthEndpoint) onUnauthorized?.()
    throw error
  }

  return data as T
}

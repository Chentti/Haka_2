import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ApiError, toApiError } from '../api/client'

export interface ApiResource<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  reload: () => void
}

interface Settled<T> {
  key: string
  attempt: number
  data: T | null
  error: ApiError | null
}

/**
 * Carga datos asociados a una `key`. Si la key cambia, la petición anterior se cancela
 * y su respuesta se descarta: lo que se muestra siempre corresponde a la última key pedida.
 */
export function useApi<T>(key: string, load: (signal: AbortSignal) => Promise<T>): ApiResource<T> {
  const loadRef = useRef(load)
  useLayoutEffect(() => {
    loadRef.current = load
  })

  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, attempt, data, error: null })
      },
      (err: unknown) => {
        if (!controller.signal.aborted) setSettled({ key, attempt, data: null, error: toApiError(err) })
      },
    )
    return () => controller.abort()
  }, [key, attempt])

  const current = settled !== null && settled.key === key && settled.attempt === attempt
  return {
    data: current ? settled.data : null,
    error: current ? settled.error : null,
    loading: !current,
    reload: () => setAttempt((a) => a + 1),
  }
}

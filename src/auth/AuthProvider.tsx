import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, setUnauthorizedHandler, toApiError, tokenStorage } from '../api/client'
import { authApi, resetCaches } from '../api/endpoints'
import type { LoginResponse, MeResponse } from '../api/types'
import { AuthContext } from './context'
import type { AuthContextValue, AuthStatus } from './context'

interface AuthState {
  status: AuthStatus
  session: MeResponse | null
  bootError: ApiError | null
  sessionExpired: boolean
}

const MAX_TIMEOUT = 2_147_483_647

export function AuthProvider({ children }: { children: ReactNode }) {
  // Si hay token guardado, empezamos "verificando" (no mostramos el login mientras tanto).
  const [state, setState] = useState<AuthState>(() => ({
    status: tokenStorage.get() ? 'checking' : 'anonymous',
    session: null,
    bootError: null,
    sessionExpired: false,
  }))
  const [bootAttempt, setBootAttempt] = useState(0)

  const endSession = useCallback((expired: boolean) => {
    tokenStorage.clear()
    resetCaches()
    setState({ status: 'anonymous', session: null, bootError: null, sessionExpired: expired })
  }, [])

  const logout = useCallback(() => endSession(false), [endSession])

  // Cualquier 401 de la API (token vencido o inválido) cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(() => endSession(true))
    return () => setUnauthorizedHandler(null)
  }, [endSession])

  // Restaurar sesión al recargar: GET /auth/me con el token guardado.
  const checking = state.status === 'checking'
  useEffect(() => {
    if (!checking) return
    const controller = new AbortController()
    authApi.me(controller.signal).then(
      (me) => {
        if (controller.signal.aborted) return
        setState({ status: 'authenticated', session: me, bootError: null, sessionExpired: false })
      },
      (err: unknown) => {
        if (controller.signal.aborted) return
        const error = toApiError(err)
        if (error.status === 401) return // el handler de 401 ya cerró la sesión
        setState((s) => ({ ...s, status: 'error', bootError: error }))
      },
    )
    return () => controller.abort()
  }, [checking, bootAttempt])

  // Cerrar sesión justo cuando vence el token.
  const expiresAt = state.session?.expiresAt
  useEffect(() => {
    if (!expiresAt) return
    const ms = new Date(expiresAt).getTime() - Date.now()
    if (Number.isNaN(ms)) return
    const timer = window.setTimeout(() => endSession(true), Math.min(Math.max(ms, 0), MAX_TIMEOUT))
    return () => window.clearTimeout(timer)
  }, [expiresAt, endSession])

  const startSession = useCallback((res: LoginResponse) => {
    tokenStorage.set(res.token)
    resetCaches()
    setState({
      status: 'authenticated',
      session: { user: res.user, team: res.team, expiresAt: res.expiresAt },
      bootError: null,
      sessionExpired: false,
    })
  }, [])

  const login = useCallback(
    async (email: string, password: string) => startSession(await authApi.login({ email, password })),
    [startSession],
  )

  const register = useCallback(
    async (teamName: string, email: string, password: string) =>
      startSession(await authApi.register({ teamName, email, password })),
    [startSession],
  )

  const retryBoot = useCallback(() => {
    setState((s) => ({ ...s, status: 'checking', bootError: null }))
    setBootAttempt((a) => a + 1)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout, retryBoot }),
    [state, login, register, logout, retryBoot],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

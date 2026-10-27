import { Navigate, Outlet, useLocation } from 'react-router'
import { ErrorState, FullScreenLoader } from '../components/ui'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { status, bootError, retryBoot, logout } = useAuth()
  const location = useLocation()

  if (status === 'checking') return <FullScreenLoader label="Verificando sesión…" />

  if (status === 'error' && bootError) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 p-4">
        <ErrorState error={bootError} onRetry={retryBoot} title="No se pudo verificar la sesión" />
        <button type="button" onClick={logout} className="text-sm font-semibold text-slate-600 underline">
          Ir al login
        </button>
      </div>
    )
  }

  if (status !== 'authenticated') {
    // Guardamos a dónde quería ir para volver ahí después del login.
    const from = { pathname: location.pathname, search: location.search, hash: location.hash }
    return <Navigate to="/login" replace state={{ from }} />
  }

  return <Outlet />
}

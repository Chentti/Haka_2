import { isRecord } from '../api/client'

/** Lee `state.from` que dejó RequireAuth y arma la ruta a la que hay que volver. */
export function getRedirectTarget(state: unknown): string {
  if (isRecord(state) && isRecord(state.from)) {
    const { pathname, search, hash } = state.from
    if (typeof pathname === 'string' && pathname.startsWith('/') && pathname !== '/login' && pathname !== '/register') {
      return `${pathname}${typeof search === 'string' ? search : ''}${typeof hash === 'string' ? hash : ''}`
    }
  }
  return '/'
}

import { createContext } from 'react'
import type { ApiError } from '../api/client'
import type { MeResponse } from '../api/types'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  session: MeResponse | null
  bootError: ApiError | null
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  register: (teamName: string, email: string, password: string) => Promise<void>
  logout: () => void
  retryBoot: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_KEY } from '../api/fetch-client'

export interface AuthContextValue {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
  isAuthenticated: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  )

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setTokenState(newToken)
  }, [])

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenState(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ token, setToken, clearToken, isAuthenticated: token !== null }),
    [token, setToken, clearToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

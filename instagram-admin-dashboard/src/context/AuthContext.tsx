import { createContext, useMemo, useState } from 'react'
import { authApi } from '../services/api/authApi'
import { authService } from '../services/authService'
import type { AdminUser, LoginPayload } from '../types'

interface AuthContextValue {
  admin: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => authService.getAdmin())
  const [token, setToken] = useState<string | null>(() => authService.getToken())
  const [loading, setLoading] = useState(false)

  const login = async (payload: LoginPayload) => {
    setLoading(true)
    try {
      const response = await authApi.login(payload)
      authService.saveSession(response)
      setAdmin(response.admin)
      setToken(response.accessToken)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.clearSession()
    setAdmin(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({
      admin,
      token,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
    }),
    [admin, token, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


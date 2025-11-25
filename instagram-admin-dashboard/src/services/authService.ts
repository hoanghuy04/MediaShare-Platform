import type { AdminUser, AuthResponse } from '../types'

const TOKEN_KEY = 'ms_admin_token'
const USER_KEY = 'ms_admin_user'

export const authService = {
  saveSession: (payload: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, payload.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.admin))
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getAdmin: (): AdminUser | null => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AdminUser) : null
  },
}


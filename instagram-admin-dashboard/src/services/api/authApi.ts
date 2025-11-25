import apiClient from './apiClient'
import type { ApiResponse, AuthResponse, LoginPayload } from '../../types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

const generateToken = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))

const mockLogin = async (payload: LoginPayload): Promise<AuthResponse> => {
  await delay()
  if (!payload.usernameOrEmail || !payload.password) {
    throw new Error('Vui lòng nhập đầy đủ thông tin')
  }
  if (payload.password !== 'admin123' && payload.password.length < 4) {
    throw new Error('Thông tin đăng nhập không hợp lệ')
  }
  return {
    accessToken: generateToken(),
    admin: {
      id: 'admin-1',
      username: payload.usernameOrEmail,
      fullName: 'Gram Admin',
      avatarUrl: 'https://i.pravatar.cc/150?img=52',
      roles: ['ADMIN'],
    },
  }
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (USE_MOCK) {
      return mockLogin(payload)
    }
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload)
    return data.data
  },
}


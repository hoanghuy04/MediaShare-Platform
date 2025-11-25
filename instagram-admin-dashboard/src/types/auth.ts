export interface LoginPayload {
  usernameOrEmail: string
  password: string
}

export interface AdminUser {
  id: string
  username: string
  fullName: string
  avatarUrl: string
  roles: string[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  admin: AdminUser
}


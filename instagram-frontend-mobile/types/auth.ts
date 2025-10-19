import { ProfileData } from './user';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profile?: ProfileData;
  roles?: string[];
  followersCount?: number;
  followingCount?: number;
  isPrivate?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

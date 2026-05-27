import { apiFetch } from '../../lib/api/fetch-client'
import type { User, AuthResponse, LoginResponse } from './types'

interface LoginInput {
  email: string
  password: string
}

interface SignupInput {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export const authApi = {
  login: (data: LoginInput) =>
    apiFetch<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signup: (data: SignupInput) =>
    apiFetch<AuthResponse>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    apiFetch('/api/v1/account/logout', { method: 'POST' }),
  profile: () =>
    apiFetch<User>('/api/v1/account/profile'),
}

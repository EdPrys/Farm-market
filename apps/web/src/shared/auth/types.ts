export interface User {
  id: number
  fullName: string | null
  email: string
  isSeller: boolean
  isSubscribed: boolean
  farmName: string | null
  phone: string | null
  telegram: string | null
  viber: string | null
  initials: string
  createdAt: string
  updatedAt: string | null
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginResponse {
  token: string
}

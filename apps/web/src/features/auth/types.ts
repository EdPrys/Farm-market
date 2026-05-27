export interface User {
  id: number
  fullName: string | null
  email: string
  isSeller: boolean
  farmName: string | null
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

export interface User {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string | null
}

export interface AuthResponse {
  user: User
  token: string
}

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  avatarUrl: string | null
}

export interface AuthResponse {
  user: User
  token: string
}
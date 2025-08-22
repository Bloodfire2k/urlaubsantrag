export interface User {
  id: string
  username: string
  fullName: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  department?: string
  createdAt: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface RegisterData {
  username: string
  fullName: string
  email: string
  password: string
  department?: string
}

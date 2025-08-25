// Types für User Management
export interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'employee'
  marketId: number
  department: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  market?: {
    id: number
    name: string
  }
}

export interface Market {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
}

export interface UserFormData {
  firstName: string
  lastName: string
  username: string
  fullName: string
  password: string
  role: 'admin' | 'manager' | 'employee'
  marketId: number
  department: string
  urlaubsanspruch: number
}

export interface Toast {
  message: string
  type: 'success' | 'error'
}

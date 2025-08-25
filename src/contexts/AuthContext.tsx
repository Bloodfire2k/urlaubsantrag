import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { User, LoginCredentials, AuthState, RegisterData } from '../types/auth'

import { httpGetJson } from '../lib/http'

// Hilfsfunktion für fetch mit Token
function fetchWithToken(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('urlaub_token')
  if (!token) {
    throw new Error('Kein gültiges Token gefunden')
  }
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  register: (data: RegisterData) => Promise<boolean>
  getCurrentUser: () => User | null
  getToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_FAILURE'; payload: string }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      }
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload }
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: null }
    case 'REGISTER_START':
      return { ...state, isLoading: true, error: null }
    case 'REGISTER_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      }
    case 'REGISTER_FAILURE':
      return { ...state, isLoading: false, error: action.payload }
    default:
      return state
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  })

  const isInitialized = useRef(false)

  // Prüfe gespeicherte Session beim Start (nur einmal)
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    
    const savedUser = localStorage.getItem('urlaub_user')
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        dispatch({ type: 'LOGIN_SUCCESS', payload: user })
      } catch (error) {
        localStorage.removeItem('urlaub_user')
      }
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' })

    try {
      const response = await fetchWithToken(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        dispatch({ type: 'LOGIN_FAILURE', payload: errorData.message || 'Login fehlgeschlagen' })
        return false
      }

      const data = await response.json()
      const user: User = {
        id: data.user.id.toString(), // Konvertiere number zu string für Frontend
        username: data.user.username,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
        department: data.user.department || 'Unbekannt',
        createdAt: data.user.created_at || new Date().toISOString()
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: user })
      localStorage.setItem('urlaub_user', JSON.stringify(user))
      localStorage.setItem('urlaub_token', data.token)
      return true
    } catch (error) {
      console.error('Login error:', error)
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Verbindungsfehler. Bitte versuchen Sie es später erneut.' })
      return false
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
    localStorage.removeItem('urlaub_user')
    localStorage.removeItem('urlaub_token')
    sessionStorage.removeItem('activeTab')
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    dispatch({ type: 'REGISTER_START' })

    try {
      const response = await fetchWithToken(`/auth/register`, {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        dispatch({ type: 'REGISTER_FAILURE', payload: errorData.message || 'Registrierung fehlgeschlagen' })
        return false
      }

      const responseData = await response.json()
      const user: User = {
        id: responseData.user.id.toString(), // Konvertiere number zu string für Frontend
        username: responseData.user.username,
        fullName: responseData.user.fullName,
        email: responseData.user.email,
        role: responseData.user.role,
        department: responseData.user.department || 'Unbekannt',
        createdAt: responseData.user.created_at || new Date().toISOString()
      }

      dispatch({ type: 'REGISTER_SUCCESS', payload: user })
      localStorage.setItem('urlaub_user', JSON.stringify(user))
      localStorage.setItem('urlaub_token', responseData.token)
      return true
    } catch (error) {
      console.error('Register error:', error)
      dispatch({ type: 'REGISTER_FAILURE', payload: 'Verbindungsfehler. Bitte versuchen Sie es später erneut.' })
      return false
    }
  }

  const getCurrentUser = (): User | null => {
    return state.user
  }

  // Änderung: getToken Funktion hinzugefügt. Grund: Zentrale Token-Verwaltung im AuthContext
  const getToken = (): string | null => {
    return localStorage.getItem('urlaub_token')
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    getCurrentUser,
    getToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

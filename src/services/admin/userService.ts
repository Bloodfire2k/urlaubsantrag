import { User, UserFormData } from '../../types/admin/user'
import { httpGetJson } from '../../lib/http'

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

export const userService = {
  // Benutzer-Counts für Dashboard laden
  async fetchUserCounts(): Promise<{ total: number; admins: number; managers: number; mitarbeiter: number }> {
    try {
      const data = await httpGetJson('/users/counts')
      return data.counts || { total: 0, admins: 0, managers: 0, mitarbeiter: 0 }
    } catch (error) {
      throw new Error(`Fehler beim Laden der Counts: ${error}`)
    }
  },

  // Benutzer laden mit erweiterten Filtern
  async fetchUsers(params?: {
    search?: string;
    marketId?: number;
    role?: string;
    department?: string;
    activeOnly?: boolean;
  }): Promise<User[]> {
    try {
      // Query-Parameter aufbauen
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append('search', params.search)
      if (params?.marketId) queryParams.append('marketId', params.marketId.toString())
      if (params?.role) queryParams.append('role', params.role)
      if (params?.department) queryParams.append('department', params.department)
      if (params?.activeOnly !== undefined) queryParams.append('activeOnly', params.activeOnly.toString())

      const queryString = queryParams.toString()
      const url = `/users${queryString ? `?${queryString}` : ''}`

      const data = await httpGetJson(url)
      
      // JSON-Response mappen: snake_case → camelCase
      const users = (data.users || []).map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        market_id: user.market_id,
        department: user.department,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
      
      return users
    } catch (error) {
      throw new Error(`Fehler beim Laden der Benutzer: ${error}`)
    }
  },

  // Benutzer erstellen
  async createUser(userData: UserFormData): Promise<User> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein gültiges Token gefunden')
    }

    const response = await fetchWithToken(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        username: userData.username,
        email: `${userData.username}@${userData.marketId === 2 ? 'ecenter' : 'edeka'}.de`,
        fullName: userData.fullName,
        password: userData.password,
        role: userData.role,
        marketId: userData.marketId,
        department: userData.department,
        urlaubsanspruch: userData.urlaubsanspruch
      })
    })

    if (response.ok) {
      return response.json()
    } else {
      const error = await response.json()
      throw new Error(error.error)
    }
  },

  // Benutzer aktualisieren
  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein gültiges Token gefunden')
    }

    const response = await fetchWithToken(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }
  },

  // Passwort zurücksetzen
  async resetPassword(userId: number): Promise<string> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein gültiges Token gefunden')
    }

    // Neues zufälliges Passwort generieren
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    const response = await fetchWithToken(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword })
    })

    if (response.ok) {
      return newPassword
    } else {
      const error = await response.json()
      throw new Error(error.message)
    }
  },

  // Eigenes Passwort setzen
  async setCustomPassword(userId: number, password: string): Promise<void> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein gültiges Token gefunden')
    }

    const response = await fetchWithToken(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
  },

  // Benutzer (de)aktivieren
  async toggleUserStatus(userId: number, isActive: boolean): Promise<void> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein gültiges Token gefunden')
    }

    const url = isActive 
      ? `/users/${userId}`
      : `/users/${userId}/reactivate`
    
    const method = isActive ? 'DELETE' : 'POST'

    const response = await fetchWithToken(url, {
      method: method
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }
  },

  // Benutzer permanent löschen
  async deleteUser(userId: number): Promise<void> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein gültiges Token gefunden')
    }

    const response = await fetchWithToken(`/users/${userId}/permanent-delete`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }
  }
}

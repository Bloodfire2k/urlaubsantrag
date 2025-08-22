import { User, UserFormData } from '../../types/admin/user'

// Dynamische API-URL für lokales Netzwerk
const getApiBaseUrl = () => {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api'
} else {
  return `https://${hostname}:3001/api`
  }
}

const API_BASE_URL = getApiBaseUrl()

export const userService = {
  // Benutzer laden
  async fetchUsers(): Promise<User[]> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein Token gefunden')
    }

    const response = await fetch(`${API_BASE_URL}/users?include_inactive=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.users || []
    } else {
      throw new Error(`Fehler beim Laden: ${response.status} ${response.statusText}`)
    }
  },

  // Benutzer erstellen
  async createUser(userData: UserFormData): Promise<User> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein gültiges Token gefunden')
    }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

    const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
      ? `${API_BASE_URL}/users/${userId}`
      : `${API_BASE_URL}/users/${userId}/reactivate`
    
    const method = isActive ? 'DELETE' : 'POST'

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

    const response = await fetch(`${API_BASE_URL}/users/${userId}/permanent-delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }
  }
}

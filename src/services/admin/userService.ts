import { User, UserFormData } from '../../types/admin/user'
import { apiFetch } from '../../lib/api'

export const userService = {
  // Benutzer-Counts für Dashboard laden
  async fetchUserCounts(): Promise<{ total: number; admins: number; managers: number; mitarbeiter: number }> {
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein Token gefunden')
    }

    const response = await apiFetch(`/users/counts?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.counts || { total: 0, admins: 0, managers: 0, mitarbeiter: 0 }
    } else {
      throw new Error(`Fehler beim Laden der Counts: ${response.status} ${response.statusText}`)
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
    const token = localStorage.getItem('urlaub_token')
    if (!token) {
      throw new Error('Kein Token gefunden')
    }

    // Query-Parameter aufbauen
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.marketId) queryParams.append('marketId', params.marketId.toString())
    if (params?.role) queryParams.append('role', params.role)
    if (params?.department) queryParams.append('department', params.department)
    if (params?.activeOnly !== undefined) queryParams.append('activeOnly', params.activeOnly.toString())
    
    // Query-Buster hinzufügen um Cache zu verhindern
    queryParams.append('t', Date.now().toString())

    const queryString = queryParams.toString()
    const url = `/users${queryString ? `?${queryString}` : ''}`

    const response = await apiFetch(url, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    // Bei 304-Response bestehenden Zustand beibehalten
    if (response.status === 304) {
      // Hier würden wir den vorherigen Zustand zurückgeben
      // Da wir keinen Zugriff auf prevUsers haben, werfen wir einen Fehler
      throw new Error('Daten nicht geändert (304) - bitte erneut versuchen')
    }

    if (response.ok) {
      const data = await response.json()
      
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

    const response = await apiFetch(`/auth/register`, {
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

    const response = await apiFetch(`/users/${userId}`, {
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

    const response = await apiFetch(`/users/${userId}/password`, {
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

    const response = await apiFetch(`/users/${userId}/password`, {
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
      ? `/users/${userId}`
      : `/users/${userId}/reactivate`
    
    const method = isActive ? 'DELETE' : 'POST'

    const response = await apiFetch(url, {
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

    const response = await apiFetch(`/users/${userId}/permanent-delete`, {
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

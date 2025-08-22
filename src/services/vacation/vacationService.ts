import { Market, User, Urlaub } from '../../types/vacation'
import { apiFetch } from '../../lib/api'

export const vacationService = {
  // Märkte laden
  async fetchMarkets(token: string): Promise<Market[]> {
    const response = await apiFetch(`/markets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      const marketsArray = data.markets || []
      return Array.isArray(marketsArray) ? marketsArray : []
    } else {
      console.error('Markets API error:', response.status)
      return []
    }
  },

  // Benutzer laden
  async fetchUsers(token: string): Promise<User[]> {
    const response = await apiFetch(`/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      const usersArray = data.users || []
      return Array.isArray(usersArray) ? usersArray.filter((user: User) => user.is_active) : []
    } else {
      console.error('Users API error:', response.status)
      return []
    }
  },

  // Urlaubsdaten laden
  async fetchUrlaube(token: string, year: number): Promise<Urlaub[]> {
    const response = await apiFetch(`/urlaub?jahr=${year}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      const urlaubeArray = data.urlaubAntraege || []
      return Array.isArray(urlaubeArray) ? urlaubeArray : []
    } else {
      console.error('Urlaube API error:', response.status)
      return []
    }
  }
}

import { Market, User, Urlaub } from '../../types/vacation'
import { apiFetch } from '../../lib/api'
import { fetchUsersList } from '../../lib/users'

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
    try {
      const result = await fetchUsersList()
      return result.items.filter((user: User) => user.isActive)
    } catch (error) {
      console.error('Users API error:', error)
      return []
    }
  },

  // Urlaubsdaten laden
  async fetchUrlaube(token: string, year: number): Promise<Urlaub[]> {
    const response = await apiFetch(`/urlaub?year=${year}`, {
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
  },

  // Urlaub-Counts für Dashboard laden
  async fetchVacationCounts(token: string, year?: number): Promise<{ total: number; offen: number; genehmigt: number; abgelehnt: number }> {
    const queryParams = new URLSearchParams()
    if (year) queryParams.append('year', year.toString())
    
    const queryString = queryParams.toString()
    const url = `/urlaub/counts${queryString ? `?${queryString}` : ''}`

    const response = await apiFetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.counts || { total: 0, offen: 0, genehmigt: 0, abgelehnt: 0 }
    } else {
      console.error('Vacation counts API error:', response.status)
      return { total: 0, offen: 0, genehmigt: 0, abgelehnt: 0 }
    }
  }
}

import { Market, User, Urlaub } from '../../types/vacation'
import { httpGetJson } from '../../lib/http'
import { fetchUsersList } from '../../lib/users'

export const vacationService = {
  // Märkte laden
  async fetchMarkets(token: string): Promise<Market[]> {
    try {
      const data = await httpGetJson('/markets')
      const marketsArray = data.markets || []
      return Array.isArray(marketsArray) ? marketsArray : []
    } catch (error) {
      console.error('Markets API error:', error)
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
    try {
      const data = await httpGetJson(`/urlaub?year=${year}`)
      const urlaubeArray = data.urlaubAntraege || []
      return Array.isArray(urlaubeArray) ? urlaubeArray : []
    } catch (error) {
      console.error('Urlaube API error:', error)
      return []
    }
  },

  // Urlaub-Counts für Dashboard laden
  async fetchVacationCounts(token: string, year?: number): Promise<{ total: number; offen: number; genehmigt: number; abgelehnt: number }> {
    try {
      const queryParams = new URLSearchParams()
      if (year) queryParams.append('year', year.toString())
      
      const queryString = queryParams.toString()
      const url = `/urlaub/counts${queryString ? `?${queryString}` : ''}`

      const data = await httpGetJson(url)
      return data.counts || { total: 0, offen: 0, genehmigt: 0, abgelehnt: 0 }
    } catch (error) {
      console.error('Vacation counts API error:', error)
      return { total: 0, offen: 0, genehmigt: 0, abgelehnt: 0 }
    }
  }
}

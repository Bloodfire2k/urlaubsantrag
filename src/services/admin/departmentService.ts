import { apiFetch } from '../../lib/api'

export const departmentService = {
  // Alle Abteilungen laden
  async loadDepartments(token?: string): Promise<string[]> {
    try {
      let authToken = token
      if (!authToken) {
        // Fallback: Token aus dem localStorage holen
        authToken = localStorage.getItem('urlaub_token')
      }
      if (!authToken) {
        throw new Error('Nicht eingeloggt')
      }

      const response = await apiFetch(`/users/departments`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Abteilungen')
      }
      const data = await response.json()
      return data.departments
    } catch (error) {
      console.error('Fehler beim Laden der Abteilungen:', error)
      return []
    }
  }
}


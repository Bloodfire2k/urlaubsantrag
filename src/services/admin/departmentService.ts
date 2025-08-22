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

      const response = await fetch(`${API_BASE_URL}/users/departments`, {
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


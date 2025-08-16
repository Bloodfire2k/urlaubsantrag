import { UrlaubBudget, Urlaub, MitarbeiterStats, GlobalStats, UrlaubStatus } from '../../types/admin/overview'
import { calculateWorkingDays } from '../../utils/vacationCalculator'

// Dynamische API-URL für lokales Netzwerk
const getApiBaseUrl = () => {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002/api'
  } else {
    return `http://${hostname}:3002/api`
  }
}

const API_BASE_URL = getApiBaseUrl()

export const overviewService = {
  // Budgets laden
  async loadBudgets(selectedYear: number, token?: string): Promise<UrlaubBudget[]> {
    try {
      let authToken = token
      if (!authToken) {
        // Fallback: Token aus dem localStorage holen
        const storedToken = localStorage.getItem('urlaub_token')
        if (!storedToken) {
          throw new Error('Nicht eingeloggt')
        }
        authToken = storedToken
      }

      const response = await fetch(`${API_BASE_URL}/urlaub/budget/all?jahr=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401 || response.status === 403) {
        // Bei Authentifizierungsproblemen zum Login weiterleiten
        window.location.href = '/login'
        throw new Error('Nicht autorisiert')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Fehler beim Laden der Budgets')
      }

      const data = await response.json()
      return data.budgets || []
    } catch (error) {
      console.error('Fehler beim Laden der Budgets:', error)
      if (error instanceof Error && error.message === 'Nicht autorisiert') {
        return []
      }
      throw error
    }
  },

  // Statistiken berechnen
  calculateStats(budgets: UrlaubBudget[], allUrlaube: Urlaub[]): { mitarbeiterStats: MitarbeiterStats[], globalStats: GlobalStats } {
    const stats: MitarbeiterStats[] = []
    let globalZuVerplanen = 0
    let globalVerplant = 0
    let globalOffen = 0

    budgets.forEach(budget => {
      // Berechne verplante Tage basierend auf pending Urlauben
      const mitarbeiterUrlaube = allUrlaube.filter(u => 
        u.mitarbeiterId == budget.mitarbeiterId && u.status === 'pending'
      )
      
      const verplanteTage = mitarbeiterUrlaube.reduce((total, urlaub) => {
        const start = new Date(urlaub.startDatum)
        const end = new Date(urlaub.endDatum)
        return total + calculateWorkingDays(start, end)
      }, 0)

      const zuVerplanen = Math.max(0, budget.jahresanspruch - budget.genommen - verplanteTage)
      const offen = mitarbeiterUrlaube.length

      stats.push({
        id: budget.mitarbeiterId,
        name: budget.mitarbeiterName,
        zuVerplanen,
        verplant: verplanteTage,
        offen,
        jahresanspruch: budget.jahresanspruch
      })

      globalZuVerplanen += zuVerplanen
      globalVerplant += verplanteTage
      globalOffen += offen
    })

    // Nach Nachnamen sortieren
    stats.sort((a, b) => {
      const nachNameA = a.name.split(' ').pop() || a.name
      const nachNameB = b.name.split(' ').pop() || b.name
      return nachNameA.localeCompare(nachNameB)
    })

    return {
      mitarbeiterStats: stats,
      globalStats: {
        zuVerplanen: globalZuVerplanen,
        verplant: globalVerplant,
        offen: globalOffen
      }
    }
  },

  // Urlaubsstatus berechnen
  getUrlaubsStatus(mitarbeiterId: number, allUrlaube: Urlaub[], budgets: UrlaubBudget[]): UrlaubStatus {
    const mitarbeiterUrlaube = allUrlaube.filter(u => u.mitarbeiterId == mitarbeiterId)
    const mitarbeiterBudget = budgets.find(b => b.mitarbeiterId === mitarbeiterId)
    
    if (!mitarbeiterBudget) return 'nicht-eingetragen'
    
    const verplanteTage = mitarbeiterUrlaube
      .filter(u => u.status === 'pending')
      .reduce((total, urlaub) => {
        const start = new Date(urlaub.startDatum)
        const end = new Date(urlaub.endDatum)
        return total + calculateWorkingDays(start, end)
      }, 0)
    
    const verfügbareTage = mitarbeiterBudget.jahresanspruch - mitarbeiterBudget.genommen - verplanteTage
    
    if (verfügbareTage <= 0) return 'eingetragen'
    if (verplanteTage > 0) return 'teilweise'
    return 'nicht-eingetragen'
  },

  // Formatierungshilfen
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE')
  }
}

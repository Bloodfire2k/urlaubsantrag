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
        const __cur = new URL(window.location.href);
        if (__cur.pathname !== '/login') {
          window.location.href = '/login'
        }
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
      // Berechne verplante Tage basierend auf pending und approved Urlauben
      const mitarbeiterUrlaube = allUrlaube.filter(u => 
        u.mitarbeiterId == budget.mitarbeiterId && (u.status === 'pending' || u.status === 'approved')
      )
      
      const verplanteTage = mitarbeiterUrlaube.reduce((total, urlaub) => {
        const start = new Date(urlaub.startDatum)
        const end = new Date(urlaub.endDatum)
        return total + calculateWorkingDays(start, end)
      }, 0)

      const zuVerplanen = budget.jahresanspruch - budget.genommen - verplanteTage
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
      const namePartsA = a.name.trim().split(' ')
      const namePartsB = b.name.trim().split(' ')
      const nachNameA = namePartsA.length > 1 ? namePartsA[namePartsA.length - 1] : a.name
      const nachNameB = namePartsB.length > 1 ? namePartsB[namePartsB.length - 1] : b.name
      return nachNameA.localeCompare(nachNameB, 'de', { sensitivity: 'base' })
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
      .filter(u => u.status === 'pending' || u.status === 'approved')
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
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }
}

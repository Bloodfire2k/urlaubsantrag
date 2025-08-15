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
  loadBudgets(selectedYear: number): UrlaubBudget[] {
    // Erstelle echte Mitarbeiter basierend auf Ihrem System
    return [
      {
        mitarbeiterId: 2,
        mitarbeiterName: 'Unternehmer Admin',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 3,
        mitarbeiterName: 'Max Mustermann',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 4,
        mitarbeiterName: 'Anna Schmidt',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 5,
        mitarbeiterName: 'Markt Manager 1',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 6,
        mitarbeiterName: 'Markt Manager 2',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 7,
        mitarbeiterName: 'Susanne Asel',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 8,
        mitarbeiterName: 'test user',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      }
    ]
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

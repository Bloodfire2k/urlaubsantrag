import { db } from '../../database'

export const budgetService = {
  // Alle Budgets für ein Jahr abrufen
  getAllBudgets(jahr: number) {
    const allUsers = db.getAllUsers()
    
    // Prüfe und erstelle fehlende Budgets für das neue Jahr
    allUsers.forEach(user => {
      const budget = db.getUrlaubBudget(user.id, jahr)
      if (!budget) {
        // Hole Vorjahresbudget als Referenz
        const vorjahresBudget = db.getUrlaubBudget(user.id, jahr - 1)
        
        // Erstelle neues Budget basierend auf Vorjahresbudget oder Standardwerten
        db.addUrlaubBudget({
          mitarbeiterId: user.id,
          jahr: jahr,
          jahresanspruch: vorjahresBudget?.jahresanspruch || 30, // Standard: 30 Tage
          genommen: 0,
          verplant: 0,
          uebertrag: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    })

    // Hole alle Budgets nach der Erstellung
    return allUsers.map(user => {
      const budget = db.getUrlaubBudget(user.id, jahr)
      return budget ? {
        ...budget,
        mitarbeiterName: user.fullName, // Füge mitarbeiterName hinzu
        mitarbeiter: {
          id: user.id,
          fullName: user.fullName,
          department: user.department
        }
      } : null
    }).filter(Boolean)
  },

  // Budget abrufen
  getBudget(userId: number, jahr: number) {
    const budget = db.getUrlaubBudget(userId, jahr)
    if (!budget) return null

    const user = db.getUserById(userId)
    return {
      ...budget,
      mitarbeiterName: user?.fullName || 'Unbekannt', // Füge mitarbeiterName hinzu
      mitarbeiter: user ? {
        id: user.id,
        fullName: user.fullName,
        department: user.department
      } : null
    }
  },

  // Budget aktualisieren
  updateBudget(budgetId: number, updates: { jahresanspruch?: number, uebertrag?: number }) {
    const budget = db.getUrlaubBudget(budgetId, new Date().getFullYear())
    if (!budget) return null

    return {
      ...budget,
      jahresanspruch: updates.jahresanspruch || budget.jahresanspruch,
      uebertrag: updates.uebertrag || budget.uebertrag,
      updated_at: new Date().toISOString()
    }
  },

  // Berechtigungsprüfungen
  canAccessBudget(userId: number, role: string, marketId: number | null, targetUserId: number) {
    if (role === 'admin') return true
    if (role === 'employee') return userId === targetUserId

    if (role === 'manager' && marketId) {
      const user = db.getUserById(targetUserId)
      return user && user.market_id === marketId
    }

    return false
  }
}

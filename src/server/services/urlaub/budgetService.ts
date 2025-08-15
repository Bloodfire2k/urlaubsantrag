import { db } from '../../database'

export const budgetService = {
  // Budget abrufen
  getBudget(userId: number, jahr: number) {
    const budget = db.getUrlaubBudget(userId, jahr)
    if (!budget) return null

    const user = db.getUserById(userId)
    return {
      ...budget,
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

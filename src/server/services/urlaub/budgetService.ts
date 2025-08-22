import { db } from '../../database'

export const budgetService = {
  // Alle Budgets für ein Jahr abrufen (nur aktive Benutzer)
  getAllBudgets(jahr: number) {
    const allUsers = db.getAllUsers().filter(user => user.is_active === true)
    
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

    // Hole alle Budgets nach der Erstellung (nur für aktive Benutzer)
    return allUsers
      .filter(user => user.is_active === true) // Doppelte Sicherheit
      .map(user => {
        const budget = db.getUrlaubBudget(user.id, jahr)
        return budget ? {
          ...budget,
          mitarbeiterName: user.fullName,
          mitarbeiter: {
            id: user.id,
            fullName: user.fullName,
            department: user.department,
            is_active: user.is_active
          }
        } : null
      })
      .filter(Boolean)
  },

  // Budget abrufen
  getBudget(userId: number, jahr: number) {
    const budget = db.getUrlaubBudget(userId, jahr)
    if (!budget) return null

    const user = db.getUserById(userId)
    // Nur aktive Benutzer zurückgeben
    if (!user || !user.is_active) return null
    
    return {
      ...budget,
      mitarbeiterName: user?.fullName || 'Unbekannt', // Füge mitarbeiterName hinzu
      mitarbeiter: user ? {
        id: user.id,
        fullName: user.fullName,
        department: user.department,
        is_active: user.is_active
      } : null
    }
  },

  // Budget aktualisieren
  updateBudget(budgetId: number, updates: { jahresanspruch?: number, uebertrag?: number }) {
    // Finde das Budget anhand der ID in den gespeicherten Budgets
    const allBudgets = db.all('SELECT * FROM urlaub_budgets')
    const budget = allBudgets.find((b: any) => b.id === budgetId)
    if (!budget) return null

    // Aktualisiere das Budget in der Datenbank
    const updatedBudget = {
      ...budget,
      jahresanspruch: updates.jahresanspruch || budget.jahresanspruch,
      uebertrag: updates.uebertrag || budget.uebertrag,
      updated_at: new Date().toISOString()
    }

    // Speichere die Änderungen direkt in der JSON-Datenbank
    try {
      // Direkt über DatabaseManager aktualisieren
      const success = db.updateUrlaubBudget(budgetId, updatedBudget)
      if (success) {
        console.log('✅ Budget erfolgreich aktualisiert:', updatedBudget)
      } else {
        console.error('❌ Budget-Update fehlgeschlagen')
        return null
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Budget-Updates:', error)
      return null
    }
    
    return updatedBudget
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
  },

  // Urlaubsanspruch setzen (neu)
  setAnnualEntitlement(userId: number, year: number, days: number) {
    if (!Number.isFinite(days) || days <= 0) {
      throw new Error('Ungültiger Urlaubsanspruch')
    }

    const current = db.getUrlaubBudget(userId, year)
    const patch = { jahresanspruch: Math.trunc(days) }
    
    if (current) {
      // Budget existiert - nur jahresanspruch aktualisieren
      const updated = {
        ...current,
        jahresanspruch: Math.trunc(days),
        updated_at: new Date().toISOString()
      }
      const success = db.updateUrlaubBudget(current.id, updated)
      if (!success) {
        throw new Error('Budget-Update fehlgeschlagen')
      }
      return updated
    } else {
      // Neu anlegen mit Vorbelegung
      return db.addUrlaubBudget({
        mitarbeiterId: userId,
        jahr: year,
        jahresanspruch: Math.trunc(days),
        genommen: 0,
        verplant: 0,
        uebertrag: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
}

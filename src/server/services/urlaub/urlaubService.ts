import { db } from '../../database'

export const urlaubService = {
  // Alle Urlaubsanträge abrufen
  getAllUrlaube(userId: number, role: string, marketId: number | null, jahr: number | null) {
    let urlaubAntraege = db.getAllUrlaubAntraege()

    // Nach Jahr filtern
    if (jahr && jahr > 2000) {
      urlaubAntraege = urlaubAntraege.filter((antrag: any) => {
        const startYear = new Date(antrag.startDatum).getFullYear()
        return startYear === jahr
      })
    }

    // Zugriffsbeschränkungen
    if (role === 'employee') {
      urlaubAntraege = urlaubAntraege.filter((antrag: any) => antrag.mitarbeiterId === userId)
    }
    else if (role === 'manager' && marketId) {
      const usersInMarket = db.getUsersByMarket(marketId)
      const userIdsInMarket = usersInMarket.map((u: any) => u.id)
      urlaubAntraege = urlaubAntraege.filter((antrag: any) => 
        userIdsInMarket.includes(antrag.mitarbeiterId)
      )
    }

    // Nur Anträge von aktiven Benutzern anzeigen
    urlaubAntraege = urlaubAntraege.filter((antrag: any) => {
      const user = db.getUserById(antrag.mitarbeiterId)
      return user && user.is_active
    })

    // Benutzer-Informationen hinzufügen
    return urlaubAntraege.map((antrag: any) => {
      const user = db.getUserById(antrag.mitarbeiterId)
      const genehmiger = antrag.genehmigt_von ? db.getUserById(antrag.genehmigt_von) : null
      
      return {
        ...antrag,
        mitarbeiterName: user?.fullName || 'Unbekannt',
        createdAt: antrag.created_at,
        mitarbeiter: user ? {
          id: user.id,
          fullName: user.fullName,
          department: user.department
        } : null,
        genehmiger: genehmiger ? {
          id: genehmiger.id,
          fullName: genehmiger.fullName
        } : null
      }
    })
  },

  // Einzelnen Urlaubsantrag abrufen
  getUrlaubById(antragId: number | string) {
    const id = typeof antragId === 'string' ? parseInt(antragId) : antragId
    if (isNaN(id)) return null
    
    const allAntraege = db.getAllUrlaubAntraege()
    return allAntraege.find(a => a.id === id)
  },

  // Neuen Urlaubsantrag erstellen
  createUrlaub(userId: number, startDatum: string, endDatum: string, bemerkung: string = '') {
    return db.addUrlaubAntrag({
      mitarbeiterId: userId,
      startDatum,
      endDatum,
      bemerkung,
      status: 'pending'
    })
  },

  // Urlaubsantrag genehmigen/ablehnen
  updateUrlaubStatus(antragId: number, status: 'approved' | 'rejected' | 'pending', genehmigerId: number) {
    const antrag = this.getUrlaubById(antragId)
    if (!antrag) return null

    const updates = {
      status,
      genehmigt_von: status === 'pending' ? null : genehmigerId,
      genehmigt_am: status === 'pending' ? null : new Date().toISOString()
    }

    // Wenn genehmigt, Urlaubsbudget aktualisieren
    if (status === 'approved') {
      const startDate = new Date(antrag.startDatum)
      const endDate = new Date(antrag.endDatum)
      const workingDays = this.calculateWorkingDays(startDate, endDate)
      
      const budget = db.getUrlaubBudget(antrag.mitarbeiterId, startDate.getFullYear())
      if (budget) {
        budget.verplant = workingDays
        // Budget update wird automatisch gespeichert
      }
    }

    // Antrag in Datenbank aktualisieren
    const savedAntrag = db.updateUrlaubAntrag(typeof antragId === 'string' ? parseInt(antragId) : antragId, updates)
    return savedAntrag
  },

  // Urlaubsantrag löschen
  deleteUrlaub(antragId: number) {
    return db.deleteUrlaubAntrag(antragId)
  },

  // Berechtigungsprüfungen
  canAccessUrlaub(userId: number, role: string, marketId: number | null, antrag: any) {
    if (role === 'admin') return true
    if (role === 'employee') return antrag.mitarbeiterId === userId

    if (role === 'manager' && marketId) {
      const user = db.getUserById(antrag.mitarbeiterId)
      return user && user.market_id === marketId
    }

    return false
  },

  // Arbeitstage zwischen zwei Daten berechnen (ohne Wochenenden)
  calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      // 0 = Sonntag, 6 = Samstag
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return workingDays
  }
}

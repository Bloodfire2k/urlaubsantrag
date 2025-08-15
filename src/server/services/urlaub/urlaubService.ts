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
  getUrlaubById(antragId: number) {
    const allAntraege = db.getAllUrlaubAntraege()
    return allAntraege.find(a => a.id === antragId)
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
  updateUrlaubStatus(antragId: number, status: 'approved' | 'rejected', genehmigerId: number) {
    const antrag = this.getUrlaubById(antragId)
    if (!antrag) return null

    const updatedAntrag = {
      ...antrag,
      status,
      genehmigt_von: genehmigerId,
      genehmigt_am: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Wenn genehmigt, Urlaubsbudget aktualisieren
    if (status === 'approved') {
      // Hier würde das Budget aktualisiert werden
      console.log('Urlaubsbudget würde aktualisiert werden')
    }

    return updatedAntrag
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
  }
}

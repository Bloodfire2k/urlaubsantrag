import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../database'
import { isDateRangeBlocked } from '../../utils/vacationBlocks'

const router = Router()

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ihr-super-geheimer-jwt-schluessel-2024'

// Middleware für JWT-Authentifizierung
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Kein Token bereitgestellt' })
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Ungültiger Token' })
  }
}

// Middleware für Admin-Berechtigung
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' })
  }
  next()
}

// Middleware für Manager- oder Admin-Berechtigung
const requireManagerOrAdmin = (req: Request, res: Response, next: Function) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Manager- oder Admin-Berechtigung erforderlich' })
  }
  next()
}

// Alle Urlaubsanträge abrufen
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    // Jahr-Parameter aus Query lesen (optional)
    const jahr = req.query.jahr ? parseInt(req.query.jahr as string) : null
    
    // Alle Urlaubsanträge aus der JSON-Datenbank laden
    let urlaubAntraege = db.getAllUrlaubAntraege()

    // Nach Jahr filtern, falls angegeben (aber nur wenn explizit gesetzt)
    if (jahr && jahr > 2000) {
      urlaubAntraege = urlaubAntraege.filter((antrag: any) => {
        const startYear = new Date(antrag.startDatum).getFullYear()
        return startYear === jahr
      })
    }

    // Mitarbeiter sehen nur ihre eigenen Anträge
    if (req.user.role === 'employee') {
      urlaubAntraege = urlaubAntraege.filter((antrag: any) => antrag.mitarbeiterId === req.user.userId)
    }
    // Manager sehen nur Anträge ihres Marktes
    else if (req.user.role === 'manager') {
      const usersInMarket = db.getUsersByMarket(req.user.marketId)
      const userIdsInMarket = usersInMarket.map((u: any) => u.id)
      urlaubAntraege = urlaubAntraege.filter((antrag: any) => 
        userIdsInMarket.includes(antrag.mitarbeiterId)
      )
    }

    // Benutzer-Informationen hinzufügen
    const antraegeMitBenutzer = urlaubAntraege.map((antrag: any) => {
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

    res.json({
      success: true,
      urlaubAntraege: antraegeMitBenutzer
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Urlaubsanträge:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Urlaubsanträge' 
    })
  }
})

// Urlaubsantrag nach ID abrufen
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const antragId = parseInt(req.params.id)
    
    // Hier würde normalerweise der Antrag aus der Datenbank abgerufen werden
    // Da wir eine JSON-Datenbank haben, simulieren wir das
    const antrag = {
      id: antragId,
      user_id: 1,
      start_datum: '2024-01-01',
      end_datum: '2024-01-05',
      bemerkung: 'Neujahrsurlaub',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Berechtigung prüfen
    if (req.user.role === 'employee' && antrag.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
    }

    if (req.user.role === 'manager') {
      const user = db.getUserById(antrag.user_id)
      if (!user || user.market_id !== req.user.marketId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
      }
    }

    // Benutzer-Informationen hinzufügen
    const user = db.getUserById(antrag.user_id)
    const antragMitBenutzer = {
      ...antrag,
      mitarbeiter: user ? {
        id: user.id,
        fullName: user.fullName,
        department: user.department
      } : null
    }

    res.json({
      success: true,
      urlaubAntrag: antragMitBenutzer
    })

  } catch (error) {
    console.error('Fehler beim Abrufen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Urlaubsantrags' 
    })
  }
})

// Neuen Urlaubsantrag erstellen
router.post('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const { start_datum, end_datum, bemerkung } = req.body

    // Validierung
    if (!start_datum || !end_datum) {
      return res.status(400).json({ 
        error: 'Start- und Enddatum sind erforderlich' 
      })
    }

    // Datum-Validierung
    const startDate = new Date(start_datum)
    const endDate = new Date(end_datum)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      return res.status(400).json({ 
        error: 'Startdatum kann nicht in der Vergangenheit liegen' 
      })
    }

    if (endDate < startDate) {
      return res.status(400).json({ 
        error: 'Enddatum muss nach dem Startdatum liegen' 
      })
    }

    // Urlaubsbudget prüfen
    const currentYear = new Date().getFullYear()
    const budget = db.getUrlaubBudget(req.user.userId, currentYear)
    
    if (!budget) {
      return res.status(400).json({ 
        error: 'Kein Urlaubsbudget für das aktuelle Jahr gefunden' 
      })
    }

    // Urlaubssperre prüfen
    const startYear = new Date(start_datum).getFullYear()
    const blockCheck = isDateRangeBlocked(startDate, endDate, startYear)
    if (blockCheck.blocked) {
      return res.status(400).json({ 
        error: `Urlaubssperre: ${blockCheck.reason}. Urlaub in diesem Zeitraum ist nicht möglich.` 
      })
    }

    // Berechne Urlaubstage (einfache Berechnung)
    const start = new Date(start_datum)
    const end = new Date(end_datum)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Prüfe ob genügend Urlaubstage verfügbar sind
    const availableDays = budget.jahresanspruch - budget.genommen - budget.verplant
    if (daysDiff > availableDays) {
      return res.status(400).json({ 
        error: `Nicht genügend Urlaubstage verfügbar. Verfügbar: ${availableDays}, Beantragt: ${daysDiff}` 
      })
    }

    // Urlaubsantrag in die Datenbank speichern
    const newAntrag = db.addUrlaubAntrag({
      mitarbeiterId: req.user.userId,
      startDatum: start_datum,
      endDatum: end_datum,
      bemerkung: bemerkung || '',
      status: 'pending'
    })

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'CREATE_URLAUB_ANTRAG',
      table_name: 'urlaub_antraege',
      record_id: newAntrag.id,
      new_values: JSON.stringify(newAntrag),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.status(201).json({
      success: true,
      message: 'Urlaubsantrag erfolgreich erstellt',
      urlaubAntrag: newAntrag
    })

  } catch (error) {
    console.error('Fehler beim Erstellen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Erstellen des Urlaubsantrags' 
    })
  }
})

// Urlaubsantrag genehmigen/ablehnen (nur für Manager und Admins)
router.put('/:id/status', authenticateToken, requireManagerOrAdmin, (req: Request, res: Response) => {
  try {
    const antragId = parseInt(req.params.id)
    const { status, bemerkung } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status muss "approved" oder "rejected" sein' 
      })
    }

    // Hier würde normalerweise der Antrag aus der Datenbank abgerufen und aktualisiert werden
    // Da wir eine JSON-Datenbank haben, simulieren wir das
    const antrag = {
      id: antragId,
      user_id: 1,
      start_datum: '2024-01-01',
      end_datum: '2024-01-05',
      bemerkung: 'Neujahrsurlaub',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Berechtigung prüfen (Manager können nur Anträge ihres Marktes bearbeiten)
    if (req.user.role === 'manager') {
      const user = db.getUserById(antrag.user_id)
      if (!user || user.market_id !== req.user.marketId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
      }
    }

    // Antrag aktualisieren
    const updatedAntrag = {
      ...antrag,
      status,
      genehmigt_von: req.user.userId,
      genehmigt_am: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Wenn genehmigt, Urlaubsbudget aktualisieren
    if (status === 'approved') {
      // Hier würde das Budget aktualisiert werden
      console.log('Urlaubsbudget würde aktualisiert werden')
    }

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: `UPDATE_URLAUB_STATUS_${status.toUpperCase()}`,
      table_name: 'urlaub_antraege',
      record_id: antragId,
      old_values: JSON.stringify(antrag),
      new_values: JSON.stringify(updatedAntrag),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: `Urlaubsantrag erfolgreich ${status === 'approved' ? 'genehmigt' : 'abgelehnt'}`,
      urlaubAntrag: updatedAntrag
    })

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Aktualisieren des Urlaubsantrags' 
    })
  }
})

// Urlaubsantrag löschen (nur eigene Anträge oder für Manager/Admins)
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const antragId = parseInt(req.params.id)
    
    // Urlaubsantrag aus der Datenbank abrufen
    const allAntraege = db.getAllUrlaubAntraege()
    const antrag = allAntraege.find(a => a.id === antragId)
    
    if (!antrag) {
      return res.status(404).json({ error: 'Urlaubsantrag nicht gefunden' })
    }

    // Berechtigung prüfen
    if (req.user.role === 'employee' && antrag.mitarbeiterId !== req.user.userId) {
      return res.status(403).json({ error: 'Sie können nur Ihre eigenen Anträge löschen' })
    }

    if (req.user.role === 'manager') {
      const user = db.getUserById(antrag.mitarbeiterId)
      if (!user || user.market_id !== req.user.marketId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
      }
    }

    // Nur ausstehende Anträge können gelöscht werden
    if (antrag.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Nur ausstehende Anträge können gelöscht werden' 
      })
    }

    // Urlaubsantrag tatsächlich löschen
    const deleted = db.deleteUrlaubAntrag(antragId)
    if (!deleted) {
      return res.status(500).json({ error: 'Fehler beim Löschen des Urlaubsantrags' })
    }

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'DELETE_URLAUB_ANTRAG',
      table_name: 'urlaub_antraege',
      record_id: antragId,
      old_values: JSON.stringify(antrag),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: 'Urlaubsantrag erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Löschen des Urlaubsantrags' 
    })
  }
})

// Urlaubsbudget abrufen
router.get('/budget/:userId', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)
    const jahr = req.query.jahr ? parseInt(req.query.jahr as string) : new Date().getFullYear()
    
    // Berechtigung prüfen
    if (req.user.role === 'employee' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Sie können nur Ihr eigenes Budget sehen' })
    }

    if (req.user.role === 'manager') {
      const user = db.getUserById(userId)
      if (!user || user.market_id !== req.user.marketId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
      }
    }

    const budget = db.getUrlaubBudget(userId, jahr)
    
    if (!budget) {
      return res.status(404).json({ error: 'Kein Urlaubsbudget für das aktuelle Jahr gefunden' })
    }

    // Benutzer-Informationen hinzufügen
    const user = db.getUserById(userId)
    const budgetMitBenutzer = {
      ...budget,
              mitarbeiter: user ? {
          id: user.id,
          fullName: user.fullName,
          department: user.department
        } : null
    }

    res.json({
      success: true,
      budget: budgetMitBenutzer
    })

  } catch (error) {
    console.error('Fehler beim Abrufen des Urlaubsbudgets:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Urlaubsbudgets' 
    })
  }
})

// Urlaubsbudget aktualisieren (nur für Manager und Admins)
router.put('/budget/:userId', authenticateToken, requireManagerOrAdmin, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)
    const { jahresanspruch, uebertrag } = req.body

    // Berechtigung prüfen (Manager können nur Budgets ihres Marktes bearbeiten)
    if (req.user.role === 'manager') {
      const user = db.getUserById(userId)
      if (!user || user.market_id !== req.user.marketId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
      }
    }

    const currentYear = new Date().getFullYear()
    const budget = db.getUrlaubBudget(userId, currentYear)
    
    if (!budget) {
      return res.status(404).json({ error: 'Kein Urlaubsbudget für das aktuelle Jahr gefunden' })
    }

    // Hier würde das Budget aktualisiert werden
    // Da wir eine JSON-Datenbank haben, simulieren wir das
    const updatedBudget = {
      ...budget,
      jahresanspruch: jahresanspruch || budget.jahresanspruch,
      uebertrag: uebertrag || budget.uebertrag,
      updated_at: new Date().toISOString()
    }

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'UPDATE_URLAUB_BUDGET',
      table_name: 'urlaub_budgets',
      record_id: budget.id,
      old_values: JSON.stringify(budget),
      new_values: JSON.stringify(updatedBudget),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: 'Urlaubsbudget erfolgreich aktualisiert',
      budget: updatedBudget
    })

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Urlaubsbudgets:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Aktualisieren des Urlaubsbudgets' 
    })
  }
})

export { router as urlaubRoutes }

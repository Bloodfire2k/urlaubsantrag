/**
 * Neue Prisma-basierte Urlaub-Routen
 * 
 * Ersetzt die alten JSON-basierten Urlaub-Routen mit effizienten
 * Datenbankabfragen und serverseiting Filterung
 */

import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { authenticateToken } from '../middleware/auth/jwtAuth'

const router = Router()

/**
 * Hilfsfunktion: Berechnet Datumsbereich für Jahr-Filterung
 */
function getYearDateRange(year: number) {
  const startOfYear = new Date(year, 0, 1) // 1. Januar
  const endOfYear = new Date(year, 11, 31, 23, 59, 59) // 31. Dezember
  return { startOfYear, endOfYear }
}

/**
 * GET /api/urlaub/counts - Aggregat für Dashboard-Kacheln
 */
router.get('/counts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { year, marketId } = req.query
    
    // Basis-Filter für Benutzer basierend auf Rolle
    let userFilter: any = {}
    
    if (req.user.role === 'employee') {
      // Mitarbeiter sehen nur ihre eigenen Anträge
      userFilter.id = req.user.id
    } else if (req.user.role === 'manager') {
      // Manager sehen nur Anträge ihres Marktes
      userFilter.marketId = req.user.marketId
    }
    // Admins sehen alle Anträge (keine Benutzer-Filter)

    // Zusätzliche Query-Filter für Benutzer
    if (marketId) {
      userFilter.marketId = parseInt(marketId as string)
    }

    // Datums-Filter für Jahr
    let dateFilter: any = {}
    if (year) {
      const yearNum = parseInt(year as string)
      const { startOfYear, endOfYear } = getYearDateRange(yearNum)
      
      dateFilter = {
        AND: [
          { endDate: { gte: startOfYear } },
          { startDate: { lte: endOfYear } }
        ]
      }
    }

    console.log('[vacations:counts] Filter:', { userFilter, dateFilter })

    const [offen, genehmigt, abgelehnt] = await Promise.all([
      prisma.vacation.count({
        where: {
          user: userFilter,
          ...dateFilter,
          status: 'offen'
        }
      }),
      prisma.vacation.count({
        where: {
          user: userFilter,
          ...dateFilter,
          status: 'genehmigt'
        }
      }),
      prisma.vacation.count({
        where: {
          user: userFilter,
          ...dateFilter,
          status: 'abgelehnt'
        }
      })
    ])

    const total = offen + genehmigt + abgelehnt

    console.log(`[vacations:counts] total=${total}, offen=${offen}, genehmigt=${genehmigt}, abgelehnt=${abgelehnt}`)

    res.json({
      pending: offen,
      approved: genehmigt,
      rejected: abgelehnt
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Urlaub-Counts:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Urlaub-Counts' 
    })
  }
})

/**
 * GET /api/urlaub - Gefilterte Urlaubsanträge
 * 
 * Query-Parameter:
 * - status: Filtert nach Status (offen, genehmigt, abgelehnt)
 * - year: Filtert nach Jahr (überschneidende Anträge)
 * - market_id: Filtert nach Markt-ID der Mitarbeiter
 * - department: Filtert nach Abteilung der Mitarbeiter
 * - activeOnly: Nur von aktiven Mitarbeitern (true/false)
 * - mitarbeiterId: Filtert nach spezifischem Mitarbeiter
 * - from: Startdatum (YYYY-MM-DD)
 * - to: Enddatum (YYYY-MM-DD)
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, year, market_id, department, activeOnly, mitarbeiterId, from, to } = req.query
    
    // Basis-Filter für Benutzer basierend auf Rolle
    let userFilter: any = {}
    
    if (req.user.role === 'employee') {
      // Mitarbeiter sehen nur ihre eigenen Anträge
      userFilter.id = req.user.id
    } else if (req.user.role === 'manager') {
      // Manager sehen nur Anträge ihres Marktes
      userFilter.marketId = req.user.marketId
    }
    // Admins sehen alle Anträge (keine Benutzer-Filter)

    // Zusätzliche Query-Filter für Benutzer
    if (mitarbeiterId) {
      userFilter.id = parseInt(mitarbeiterId as string)
    }
    
    if (market_id) {
      userFilter.marketId = parseInt(market_id as string)
    }
    
    if (department) {
      userFilter.department = department as string
    }
    
    if (activeOnly === 'true') {
      userFilter.isActive = true
    }

    // Datums-Filter für Jahr oder spezifischen Bereich
    let dateFilter: any = {}
    if (year) {
      const yearNum = parseInt(year as string)
      const { startOfYear, endOfYear } = getYearDateRange(yearNum)
      
      // Urlaubsanträge die das Jahr überschneiden:
      // (endDate >= 1.1.Jahr) AND (startDate <= 31.12.Jahr)
      dateFilter = {
        AND: [
          { endDate: { gte: startOfYear } },
          { startDate: { lte: endOfYear } }
        ]
      }
    } else if (from || to) {
      // Spezifischer Datumsbereich
      if (from) {
        dateFilter.startDate = { gte: new Date(from as string) }
      }
      if (to) {
        dateFilter.endDate = { lte: new Date(to as string) }
      }
    }

    // Status-Filter
    let statusFilter: any = {}
    if (status) {
      statusFilter.status = status as string
    }

    console.log('[vacations:list] Filter:', { userFilter, dateFilter, statusFilter })

    const urlaubAntraege = await prisma.vacation.findMany({
      where: {
        user: userFilter,
        ...dateFilter,
        ...statusFilter
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            department: true,
            marketId: true,
            market: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { startDate: 'asc' },
        { user: { fullName: 'asc' } }
      ]
    })

    // Daten für Frontend-Kompatibilität transformieren
    const transformedAntraege = urlaubAntraege.map(antrag => ({
      id: antrag.id,
      mitarbeiterId: antrag.userId,
      startDatum: antrag.startDate.toISOString().split('T')[0], // YYYY-MM-DD Format
      endDatum: antrag.endDate.toISOString().split('T')[0],
      status: antrag.status,
      bemerkung: antrag.description,
      created_at: antrag.createdAt.toISOString(),
      updated_at: antrag.updatedAt.toISOString(),
      // Zusätzliche Mitarbeiter-Informationen
      mitarbeiterName: antrag.user.fullName,
      mitarbeiter: {
        id: antrag.user.id,
        fullName: antrag.user.fullName,
        department: antrag.user.department,
        marketId: antrag.user.marketId,
        market: antrag.user.market
      }
    }))

    console.log(`[vacations:list] count=${transformedAntraege.length}`)

    res.json({
      items: transformedAntraege,
      total: transformedAntraege.length
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Urlaubsanträge:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Urlaubsanträge' 
    })
  }
})

/**
 * GET /api/urlaub/:id - Einzelnen Urlaubsantrag abrufen
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const antragId = parseInt(req.params.id)
    
    const antrag = await prisma.vacation.findUnique({
      where: { id: antragId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            department: true,
            marketId: true,
            market: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!antrag) {
      return res.status(404).json({ error: 'Urlaubsantrag nicht gefunden' })
    }

    // Berechtigung prüfen
    if (req.user.role === 'employee' && antrag.userId !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
    }

    if (req.user.role === 'manager' && antrag.user.marketId !== req.user.marketId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Antrag' })
    }

    // Daten transformieren
    const transformedAntrag = {
      id: antrag.id,
      mitarbeiterId: antrag.userId,
      startDatum: antrag.startDate.toISOString().split('T')[0],
      endDatum: antrag.endDate.toISOString().split('T')[0],
      status: antrag.status,
      bemerkung: antrag.description,
      created_at: antrag.createdAt.toISOString(),
      updated_at: antrag.updatedAt.toISOString(),
      mitarbeiterName: antrag.user.fullName,
      mitarbeiter: {
        id: antrag.user.id,
        fullName: antrag.user.fullName,
        department: antrag.user.department,
        marketId: antrag.user.marketId,
        market: antrag.user.market
      }
    }

    res.json({
      urlaubAntrag: transformedAntrag
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Urlaubsantrags' 
    })
  }
})

/**
 * POST /api/urlaub - Neuen Urlaubsantrag erstellen
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { start_datum, end_datum, bemerkung } = req.body

    // Validierung
    if (!start_datum || !end_datum) {
      return res.status(400).json({ 
        error: 'Start- und Enddatum sind erforderlich' 
      })
    }

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

    const newAntrag = await prisma.vacation.create({
      data: {
        userId: req.user.id,
        startDate,
        endDate,
        description: bemerkung || null,
        status: 'offen'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            department: true
          }
        }
      }
    })

    // Transformierte Antwort
    const transformedAntrag = {
      id: newAntrag.id,
      mitarbeiterId: newAntrag.userId,
      startDatum: newAntrag.startDate.toISOString().split('T')[0],
      endDatum: newAntrag.endDate.toISOString().split('T')[0],
      status: newAntrag.status,
      bemerkung: newAntrag.description,
      created_at: newAntrag.createdAt.toISOString(),
      updated_at: newAntrag.updatedAt.toISOString(),
      mitarbeiterName: newAntrag.user.fullName,
      mitarbeiter: newAntrag.user
    }

    res.status(201).json({
      message: 'Urlaubsantrag erfolgreich erstellt',
      urlaubAntrag: transformedAntrag
    })

  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Urlaubsantrags:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Erstellen des Urlaubsantrags' 
    })
  }
})

/**
 * GET /api/urlaub/budget - Budget eines Mitarbeiters abrufen
 */
router.get('/budget', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { mitarbeiterId, jahr } = req.query
    
    if (!mitarbeiterId || !jahr) {
      return res.status(400).json({ 
        error: 'mitarbeiterId und jahr sind erforderlich' 
      })
    }

    const userId = parseInt(mitarbeiterId as string)
    const year = parseInt(jahr as string)
    
    if (!Number.isFinite(userId) || !Number.isFinite(year)) {
      return res.status(400).json({ 
        error: 'Ungültige mitarbeiterId oder jahr' 
      })
    }

    // Berechtigung prüfen
    if (req.user.role === 'employee' && req.user.id !== userId) {
      return res.status(403).json({ 
        error: 'Keine Berechtigung für diesen Mitarbeiter' 
      })
    }

    if (req.user.role === 'manager') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { marketId: true }
      })
      
      if (!user || user.marketId !== req.user.marketId) {
        return res.status(403).json({ 
          error: 'Keine Berechtigung für diesen Mitarbeiter' 
        })
      }
    }

    // Datumsbereich für das Jahr
    const { startOfYear, endOfYear } = getYearDateRange(year)

    // Budget aus VacationBudget abrufen
    const budget = await prisma.vacationBudget.findFirst({
      where: {
        userId,
        year
      }
    })

    // Genutzte Urlaubstage zählen
    const genutztTage = await prisma.vacation.count({
      where: {
        userId,
        status: 'genehmigt',
        AND: [
          { endDate: { gte: startOfYear } },
          { startDate: { lte: endOfYear } }
        ]
      }
    })

    const budgetTage = budget?.days || 25 // Standard: 25 Tage
    const verbleibendTage = Math.max(0, budgetTage - genutztTage)

    console.log(`[vacations:budget] userId=${userId}, year=${year}, budget=${budgetTage}, genutzt=${genutztTage}, verbleibend=${verbleibendTage}`)

    res.json({
      jahr: year,
      budgetTage,
      genutztTage,
      verbleibendTage
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Budgets:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Budgets' 
    })
  }
})

export { router as urlaubPrismaRoutes }

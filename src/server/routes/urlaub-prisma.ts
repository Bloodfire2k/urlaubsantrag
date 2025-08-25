/**
 * Neue Prisma-basierte Urlaub-Routen
 * 
 * Ersetzt die alten JSON-basierten Urlaub-Routen mit effizienten
 * Datenbankabfragen und serverseiting Filterung
 */

import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'ihr-super-geheimer-jwt-schluessel-2024'

// Middleware für JWT-Authentifizierung
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Kein Token bereitgestellt' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Ungültiger Token' })
  }
}

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
      userFilter.id = req.user.userId
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
      success: true,
      counts: { total, offen, genehmigt, abgelehnt }
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
 * - year: Filtert nach Jahr (überschneidende Anträge)
 * - market_id: Filtert nach Markt-ID der Mitarbeiter
 * - department: Filtert nach Abteilung der Mitarbeiter
 * - activeOnly: Nur von aktiven Mitarbeitern (true/false)
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { year, market_id, department, activeOnly } = req.query
    
    // Basis-Filter für Benutzer basierend auf Rolle
    let userFilter: any = {}
    
    if (req.user.role === 'employee') {
      // Mitarbeiter sehen nur ihre eigenen Anträge
      userFilter.id = req.user.userId
    } else if (req.user.role === 'manager') {
      // Manager sehen nur Anträge ihres Marktes
      userFilter.marketId = req.user.marketId
    }
    // Admins sehen alle Anträge (keine Benutzer-Filter)

    // Zusätzliche Query-Filter für Benutzer
    if (market_id) {
      userFilter.marketId = parseInt(market_id as string)
    }
    
    if (department) {
      userFilter.department = department as string
    }
    
    if (activeOnly === 'true') {
      userFilter.isActive = true
    }

    // Datums-Filter für Jahr
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
    }

    console.log('[vacations:list] Filter:', { userFilter, dateFilter })

    const urlaubAntraege = await prisma.vacation.findMany({
      where: {
        user: userFilter,
        ...dateFilter
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
      success: true,
      urlaubAntraege: transformedAntraege
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
    if (req.user.role === 'employee' && antrag.userId !== req.user.userId) {
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
      success: true,
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
        userId: req.user.userId,
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
      success: true,
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

export { router as urlaubPrismaRoutes }

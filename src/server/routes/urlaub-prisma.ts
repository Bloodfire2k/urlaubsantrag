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
 * Hilfsfunktion: Berechnet Tage zwischen zwei Daten (inklusive)
 */
function daysInclusive(start: Date, end: Date) {
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  return Math.floor((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

/**
 * GET /api/urlaub/counts - Aggregat für Dashboard-Kacheln
 */
router.get('/counts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { year, marketId } = req.query
    
    // Basis-Filter für Benutzer basierend auf Rolle
    let userFilter: any = {}
    
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' })
    }
    
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
           userId: userFilter.id ? { equals: userFilter.id } : undefined,
           marketId: userFilter.marketId ? { equals: userFilter.marketId } : undefined,
           ...dateFilter,
           status: 'offen'
         }
       }),
       prisma.vacation.count({
         where: {
           userId: userFilter.id ? { equals: userFilter.id } : undefined,
           marketId: userFilter.marketId ? { equals: userFilter.marketId } : undefined,
           ...dateFilter,
           status: 'genehmigt'
         }
       }),
       prisma.vacation.count({
         where: {
           userId: userFilter.id ? { equals: userFilter.id } : undefined,
           marketId: userFilter.marketId ? { equals: userFilter.marketId } : undefined,
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
    
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' })
    }
    
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
         userId: userFilter.id ? { equals: userFilter.id } : undefined,
         marketId: userFilter.marketId ? { equals: userFilter.marketId } : undefined,
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
     const transformedAntraege = urlaubAntraege.map((antrag: any) => ({
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
    const jahr = Number(req.query.jahr ?? new Date().getFullYear());
    const mitarbeiterId = Number(req.query.mitarbeiterId ?? req.user?.id);
    if (!mitarbeiterId) return res.status(400).json({ error: 'missing_employee_id' });

    const user = await prisma.user.findUnique({
      where: { id: mitarbeiterId },
      select: { id: true, fullName: true, department: true, marketId: true, urlaubstageAnspruch: true, urlaubstage: true, annualLeaveDays: true },
    });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const start = new Date(Date.UTC(jahr, 0, 1, 0, 0, 0));
    const end   = new Date(Date.UTC(jahr, 11, 31, 23, 59, 59));

    // wichtig: KEIN select: { days: true }
    const vacations = await prisma.vacation.findMany({
      where: { userId: mitarbeiterId, status: 'genehmigt', startDate: { gte: start, lte: end } },
      select: { id: true, startDate: true, endDate: true },
    });

    const usedDays = vacations.reduce((sum, v) => sum + daysInclusive(v.startDate, v.endDate), 0);
    const entitlement =
      user.urlaubstageAnspruch ?? user.urlaubstage ?? user.annualLeaveDays ?? 25;

    return res.json({
      jahr,
      employee: { id: user.id, name: user.fullName, department: user.department, marketId: user.marketId },
      entitlement,
      usedDays,
      remainingDays: Math.max(entitlement - usedDays, 0),
      vacations: vacations.map(v => ({
        id: v.id, startDate: v.startDate, endDate: v.endDate,
        days: daysInclusive(v.startDate, v.endDate),
      })),
    });
  } catch (err) {
    console.error('[vacations:budget:single]', err);
    const jahr = Number(req.query.jahr ?? new Date().getFullYear());
    // niemals HTML/404; bei Fehlern Defaults zurückgeben
    return res.status(200).json({ jahr, entitlement: 25, usedDays: 0, remainingDays: 25, vacations: [] });
  }
});

/**
 * GET /api/urlaub/budget/all - Budget aller Mitarbeiter abrufen (nur admin|manager)
 */
router.get('/budget/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Berechtigung prüfen - nur Admins und Manager
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(403).json({ error: 'Keine Berechtigung für alle Budgets' });
    }

    const jahr = Number(req.query.jahr ?? new Date().getFullYear());
    const start = new Date(Date.UTC(jahr, 0, 1, 0, 0, 0));
    const end   = new Date(Date.UTC(jahr, 11, 31, 23, 59, 59));

    let userFilter: any = {}
    if (req.user.role === 'manager') {
      userFilter.marketId = req.user.marketId
    }

    const users = await prisma.user.findMany({
      where: userFilter,
      select: { id: true, fullName: true, department: true, marketId: true, urlaubstageAnspruch: true, urlaubstage: true, annualLeaveDays: true },
    });

    // Alle genehmigten Urlaube im Jahr holen und pro User summieren
    const vacations = await prisma.vacation.findMany({
      where: { 
        status: 'genehmigt', 
        startDate: { gte: start, lte: end } 
      },
      select: { userId: true, startDate: true, endDate: true },
    });

    const usedByUser = new Map<number, number>();
    for (const v of vacations) {
      usedByUser.set(v.userId, (usedByUser.get(v.userId) ?? 0) + daysInclusive(v.startDate, v.endDate));
    }

    const items = users.map(u => {
      const entitlement = u.urlaubstageAnspruch ?? u.urlaubstage ?? u.annualLeaveDays ?? 25;
      const usedDays = usedByUser.get(u.id) ?? 0;
      return {
        employee: { id: u.id, name: u.fullName, department: u.department, marketId: u.marketId },
        entitlement,
        usedDays,
        remainingDays: Math.max(entitlement - usedDays, 0),
      };
    });

    return res.json({ jahr, total: items.length, items });
  } catch (err) {
    console.error('[vacations:budget:all]', err);
    const jahr = Number(req.query.jahr ?? new Date().getFullYear());
    return res.status(200).json({ jahr, total: 0, items: [] });
  }
});

export { router as urlaubPrismaRoutes }

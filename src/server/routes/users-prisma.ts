/**
 * Neue Prisma-basierte User-Routen
 * 
 * Ersetzt die alten JSON-basierten User-Routen mit effizienten
 * Datenbankabfragen über Prisma ORM
 */

import { Router, Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { authenticateToken } from '../middleware/auth/jwtAuth'

const router = Router()

// Typdefinition für User-Daten aus der Datenbank
type UserDb = {
  id: number
  username: string | null
  email: string | null
  fullName: string
  role: string
  department: string | null
  marketId: number | null
  isActive: boolean
  createdAt: Date
  market?: { id: number; name: string } | null
}

// Hilfsfunktion für Mapping von camelCase zu snake_case
function mapUserToSnake(u: UserDb) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    department: u.department ?? null,
    market_id: u.marketId,
    is_active: u.isActive,
    created_at: u.createdAt,
    market: u.market ? { id: u.market.id, name: u.market.name } : null,
  }
}


/**
 * GET /api/users/counts - Aggregat für Dashboard-Kacheln
 */
router.get('/counts', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' })
    }

    console.log('[users:counts] Benutzerrolle:', req.user.role)
    
    // Basis-Filter basierend auf Benutzerrolle
    let whereClause: any = {}
    
    if (req.user.role === 'manager') {
      whereClause.marketId = req.user.marketId
    }
    // Admins sehen alle, Employees sehen nur sich selbst (aber das ist hier nicht relevant)

    const [total, admins, managers, mitarbeiter] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.count({ where: { ...whereClause, role: 'admin' } }),
      prisma.user.count({ where: { ...whereClause, role: 'manager' } }),
      prisma.user.count({ where: { ...whereClause, role: 'employee' } }),
    ])

    console.log(`[users:counts] total=${total}, admins=${admins}, managers=${managers}, mitarbeiter=${mitarbeiter}`)

    res.json({
      total, admins, managers, mitarbeiter
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Benutzer-Counts:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Benutzer-Counts' 
    })
  }
})

/**
 * GET /api/users - Gefilterte Benutzerabfrage
 * 
 * Query-Parameter:
 * - role: Filtert nach Rolle (optional)
 * - marketId: Filtert nach Markt-ID (optional)
 * - q: Sucht in username, fullName, email (optional)
 * - limit: Maximale Anzahl Ergebnisse (default 100)
 * - offset: Offset für Paginierung (default 0)
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' })
    }

    const { role, marketId, q, limit = '100', offset = '0' } = req.query
    
    // Basis-Filter basierend auf Benutzerrolle
    let whereClause: any = {}
    
    if (req.user.role === 'employee') {
      // Mitarbeiter sehen nur sich selbst
      whereClause.id = req.user.id
    } else if (req.user.role === 'manager') {
      // Manager sehen nur Benutzer ihres Marktes
      whereClause.marketId = req.user.marketId
    }
    // Admins sehen alle Benutzer (keine zusätzlichen Filter)

    // Zusätzliche Query-Filter anwenden
    if (q) {
      whereClause.OR = [
        { username: { contains: q as string, mode: "insensitive" } },
        { fullName: { contains: q as string, mode: "insensitive" } },
        { email: { contains: q as string, mode: "insensitive" } },
      ]
    }
    
    if (marketId) {
      whereClause.marketId = parseInt(marketId as string)
    }
    
    if (role) {
      whereClause.role = role as string
    }

    const limitNum = Math.min(parseInt(limit as string) || 100, 1000)
    const offsetNum = parseInt(offset as string) || 0

    console.log('[users:list] Filter:', whereClause, 'limit:', limitNum, 'offset:', offsetNum)

    // Identisches where-Objekt für count und findMany
    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          department: true,
          marketId: true,
          isActive: true,
          createdAt: true,
          market: { 
            select: { 
              id: true, 
              name: true 
            } 
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum
      })
    ])

    // Response über mapUserToSnake bauen
    const items = users.map(mapUserToSnake)

    console.log(`[users:list] sending ${items.length} of total=${total}`)

    res.json({
      items: items,
      total: total
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Benutzer:', error)
    // Bei Fehlern leere Liste zurückgeben statt 500
    res.status(200).json({ 
      items: [],
      total: 0
    })
  }
})

/**
 * GET /api/users/:id - Einzelnen Benutzer abrufen
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' })
    }

    const userId = parseInt(req.params.id)
    
    // Berechtigung prüfen
    if (req.user.role === 'employee' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        marketId: true,
        isActive: true,
        createdAt: true,
        market: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Manager können nur Benutzer ihres Marktes sehen
    if (req.user.role === 'manager' && user.marketId !== req.user.marketId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    res.json({
      user: mapUserToSnake(user)
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Benutzers:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Benutzers' 
    })
  }
})

/**
 * PUT /api/users/:id - Benutzer aktualisieren
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' })
    }

    const userId = parseInt(req.params.id)
    
    // Berechtigung prüfen
    if (req.user.role === 'employee' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    // Manager können nur Benutzer ihres Marktes bearbeiten
    if (req.user.role === 'manager') {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!existingUser || existingUser.marketId !== req.user.marketId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
      }
    }

    const { 
      email, 
      fullName, 
      department, 
      isActive, 
      role, 
      marketId,
      urlaubsanspruch,
      annualLeaveDays,
      // snake_case Support für UI-Kompatibilität
      is_active,
      market_id
    } = req.body

    // Nur Admins können Rollen und Märkte ändern
    const updateData: any = {}
    if (email !== undefined) updateData.email = email
    if (fullName !== undefined) updateData.fullName = fullName
    if (department !== undefined) updateData.department = department
    
    // isActive mappen (beide Formate unterstützen)
    if (isActive !== undefined) updateData.isActive = isActive
    if (is_active !== undefined) updateData.isActive = is_active
    
    // Urlaubsanspruch mappen (vom Frontend)
    const annualLeaveDaysValue = Number(urlaubsanspruch ?? annualLeaveDays ?? 25)
    updateData.annualLeaveDays = annualLeaveDaysValue
    
    if (req.user.role === 'admin') {
      if (role !== undefined) updateData.role = role
      // marketId mappen (beide Formate unterstützen)
      if (marketId !== undefined) updateData.marketId = marketId
      if (market_id !== undefined) updateData.marketId = market_id
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        marketId: true,
        isActive: true,
        createdAt: true,
        market: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.json({
      message: 'Benutzer erfolgreich aktualisiert',
      user: mapUserToSnake(updatedUser)
    })

  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Benutzers:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Aktualisieren des Benutzers' 
    })
  }
})

/**
 * GET /api/users/healthz - Health Check
 */
router.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

/**
 * PUT /api/users/:id/password - Passwort ändern
 */
router.put('/:id/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const { password } = req.body ?? {}
    
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'invalid id' })
    }
    
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'password too short' })
    }

    // Nur Admin oder der Benutzer selbst
    const me = req.user as { id: number; role: string }
    if (!me) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    
    if (me.role !== 'admin' && me.id !== id) {
      return res.status(403).json({ error: 'forbidden' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    })

    return res.json({ ok: true })
  } catch (err) {
    console.error('[users:password]', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

export { router as usersPrismaRoutes }

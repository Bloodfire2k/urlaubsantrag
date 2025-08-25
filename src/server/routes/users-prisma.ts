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



/**
 * GET /api/users/counts - Aggregat für Dashboard-Kacheln
 */
router.get('/counts', authenticateToken, async (req: Request, res: Response) => {
  try {
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
 * - search: Sucht in username, fullName, email
 * - marketId: Filtert nach Markt-ID
 * - role: Filtert nach Rolle
 * - department: Filtert nach Abteilung
 * - activeOnly: Nur aktive Benutzer (true/false)
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, marketId, role, department, activeOnly } = req.query
    
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
    if (search) {
      whereClause.OR = [
        { username: { contains: search as string, mode: "insensitive" } },
        { fullName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ]
    }
    
    if (marketId) {
      whereClause.marketId = parseInt(marketId as string)
    }
    
    if (role) {
      whereClause.role = role as string
    }
    
    if (department) {
      whereClause.department = department as string
    }
    
    if (activeOnly === 'true') {
      whereClause.isActive = true
    }

    // Sicherstellen, dass immer gültige Werte zurückgegeben werden
    try {

    console.log('[users:list] Filter:', whereClause)

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        marketId: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        market: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { fullName: 'asc' }
      ]
    })

    console.log(`[users:list] count=${users.length}`)

      res.json({
        items: users,
        total: users.length
      })
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Benutzer:', error)
      // Bei Fehlern leere Liste zurückgeben statt 500
      res.status(200).json({ 
        items: [],
        total: 0
      })
    }
  } catch (error) {
    console.error('❌ Kritischer Fehler beim Abrufen der Benutzer:', error)
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
        marketId: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
      user
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
      marketId 
    } = req.body

    // Nur Admins können Rollen und Märkte ändern
    const updateData: any = {}
    if (email !== undefined) updateData.email = email
    if (fullName !== undefined) updateData.fullName = fullName
    if (department !== undefined) updateData.department = department
    if (isActive !== undefined) updateData.isActive = isActive
    
    if (req.user.role === 'admin') {
      if (role !== undefined) updateData.role = role
      if (marketId !== undefined) updateData.marketId = marketId
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
        marketId: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
      user: updatedUser
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

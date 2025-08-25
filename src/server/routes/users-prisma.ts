/**
 * Neue Prisma-basierte User-Routen
 * 
 * Ersetzt die alten JSON-basierten User-Routen mit effizienten
 * Datenbankabfragen über Prisma ORM
 */

import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required') })()

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

// Middleware für Admin-Berechtigung
const requireAdmin = (req: Request, res: Response, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' })
  }
  next()
}

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
      success: true,
      counts: { total, admins, managers, mitarbeiter }
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
      whereClause.id = req.user.userId
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
      success: true,
      users
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Benutzer:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Benutzer' 
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
    if (req.user.role === 'employee' && req.user.userId !== userId) {
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
      success: true,
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
    if (req.user.role === 'employee' && req.user.userId !== userId) {
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
      success: true,
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

export { router as usersPrismaRoutes }

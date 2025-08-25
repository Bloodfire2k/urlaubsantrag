/**
 * Neue Prisma-basierte Market-Routen
 * 
 * Ersetzt die alten JSON-basierten Market-Routen mit effizienten
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

/**
 * GET /api/markets - Alle Märkte abrufen
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    let whereClause: any = {}

    // Manager sehen nur ihren eigenen Markt
    if (req.user.role === 'manager') {
      whereClause.id = req.user.marketId
    }
    // Admins und Employees sehen alle Märkte

    const markets = await prisma.market.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`[markets:list] count=${markets.length}`)

    res.json({
      success: true,
      markets
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Märkte:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Märkte' 
    })
  }
})

/**
 * GET /api/markets/:id - Einzelnen Markt abrufen
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.id)
    
    // Manager können nur ihren eigenen Markt sehen
    if (req.user.role === 'manager' && req.user.marketId !== marketId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Markt' })
    }

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        users: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            fullName: true,
            department: true,
            role: true
          }
        },
        _count: {
          select: {
            users: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!market) {
      return res.status(404).json({ error: 'Markt nicht gefunden' })
    }

    res.json({
      success: true,
      market
    })

  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Marktes:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Marktes' 
    })
  }
})

export { router as marketsPrismaRoutes }

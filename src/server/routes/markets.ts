import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../database'

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

// Alle Märkte abrufen
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    let markets = db.all('SELECT * FROM markets')

    // Manager sehen nur ihren eigenen Markt
    if (req.user.role === 'manager') {
      markets = markets.filter((market: any) => market.id === req.user.marketId)
    }

    res.json({
      success: true,
      markets
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Märkte:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Märkte' 
    })
  }
})

// Markt nach ID abrufen
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.id)
    
    // Manager können nur ihren eigenen Markt sehen
    if (req.user.role === 'manager' && req.user.marketId !== marketId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Markt' })
    }

    const market = db.getMarketById(marketId)
    if (!market) {
      return res.status(404).json({ error: 'Markt nicht gefunden' })
    }

    res.json({
      success: true,
      market
    })

  } catch (error) {
    console.error('Fehler beim Abrufen des Marktes:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Marktes' 
    })
  }
})

// Neuen Markt erstellen (nur für Admins)
router.post('/', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, manager_id } = req.body

    // Validierung
    if (!name) {
      return res.status(400).json({ 
        error: 'Marktname ist erforderlich' 
      })
    }

    // Prüfe ob Marktname bereits existiert
    const existingMarkets = db.all('SELECT * FROM markets')
    const nameExists = existingMarkets.some((market: any) => 
      market.name.toLowerCase() === name.toLowerCase()
    )
    
    if (nameExists) {
      return res.status(400).json({ 
        error: 'Ein Markt mit diesem Namen existiert bereits' 
      })
    }

    // Prüfe ob Manager existiert (falls angegeben)
    if (manager_id) {
      const manager = db.getUserById(manager_id)
      if (!manager || manager.role !== 'manager') {
        return res.status(400).json({ 
          error: 'Der angegebene Manager existiert nicht oder hat nicht die Manager-Rolle' 
        })
      }
    }

    // Neuen Markt erstellen
    const newMarket = db.addMarket({
      name,
      address,
      phone,
      email,
      manager_id
    })

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'CREATE_MARKET',
      table_name: 'markets',
      record_id: newMarket.id,
      new_values: JSON.stringify(newMarket),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.status(201).json({
      success: true,
      message: 'Markt erfolgreich erstellt',
      market: newMarket
    })

  } catch (error) {
    console.error('Fehler beim Erstellen des Marktes:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Erstellen des Marktes' 
    })
  }
})

// Markt aktualisieren (nur für Admins)
router.put('/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.id)
    const { name, address, phone, email, manager_id } = req.body

    // Prüfe ob Markt existiert
    const existingMarket = db.getMarketById(marketId)
    if (!existingMarket) {
      return res.status(404).json({ error: 'Markt nicht gefunden' })
    }

    // Prüfe ob neuer Name bereits existiert (außer bei diesem Markt)
    if (name && name !== existingMarket.name) {
      const allMarkets = db.all('SELECT * FROM markets')
      const nameExists = allMarkets.some((market: any) => 
        market.id !== marketId && market.name.toLowerCase() === name.toLowerCase()
      )
      
      if (nameExists) {
        return res.status(400).json({ 
          error: 'Ein Markt mit diesem Namen existiert bereits' 
        })
      }
    }

    // Prüfe ob Manager existiert (falls angegeben)
    if (manager_id) {
      const manager = db.getUserById(manager_id)
      if (!manager || manager.role !== 'manager') {
        return res.status(400).json({ 
          error: 'Der angegebene Manager existiert nicht oder hat nicht die Manager-Rolle' 
        })
      }
    }

    // Markt aktualisieren
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (address !== undefined) updates.address = address
    if (phone !== undefined) updates.phone = phone
    if (email !== undefined) updates.email = email
    if (manager_id !== undefined) updates.manager_id = manager_id

    const updatedMarket = db.updateMarket(marketId, updates)
    if (!updatedMarket) {
      return res.status(500).json({ error: 'Fehler beim Aktualisieren des Marktes' })
    }

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'UPDATE_MARKET',
      table_name: 'markets',
      record_id: marketId,
      old_values: JSON.stringify(existingMarket),
      new_values: JSON.stringify(updatedMarket),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: 'Markt erfolgreich aktualisiert',
      market: updatedMarket
    })

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Marktes:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Aktualisieren des Marktes' 
    })
  }
})

// Markt löschen (nur für Admins)
router.delete('/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.id)

    // Prüfe ob Markt existiert
    const market = db.getMarketById(marketId)
    if (!market) {
      return res.status(404).json({ error: 'Markt nicht gefunden' })
    }

    // Prüfe ob noch Benutzer diesem Markt zugeordnet sind
    const usersInMarket = db.getUsersByMarket(marketId)
    if (usersInMarket.length > 0) {
      return res.status(400).json({ 
        error: 'Markt kann nicht gelöscht werden, da noch Benutzer zugeordnet sind' 
      })
    }

    // Hier würde normalerweise das Löschen erfolgen
    // Da wir eine JSON-Datenbank haben, markieren wir den Markt als inaktiv
    // In einer echten Datenbank würden wir DELETE verwenden
    
    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'DELETE_MARKET',
      table_name: 'markets',
      record_id: marketId,
      old_values: JSON.stringify(market),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: 'Markt erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen des Marktes:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Löschen des Marktes' 
    })
  }
})

// Markt-Statistiken abrufen
router.get('/:id/stats', authenticateToken, requireManagerOrAdmin, (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.id)
    
    // Manager können nur Statistiken ihres eigenen Marktes sehen
    if (req.user.role === 'manager' && req.user.marketId !== marketId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Markt' })
    }

    const market = db.getMarketById(marketId)
    if (!market) {
      return res.status(404).json({ error: 'Markt nicht gefunden' })
    }

    // Benutzer in diesem Markt
    const usersInMarket = db.getUsersByMarket(marketId)
    
    // Urlaubsbudgets für diesen Markt
    const budgets = db.all('SELECT * FROM urlaub_budgets')
    const marketBudgets = budgets.filter((budget: any) => 
      usersInMarket.some((user: any) => user.id === budget.user_id)
    )

    const stats = {
      market: {
        id: market.id,
        name: market.name,
        address: market.address,
        phone: market.phone,
        email: market.email
      },
      users: {
        total: usersInMarket.length,
        active: usersInMarket.filter((u: any) => u.is_active).length,
        inactive: usersInMarket.filter((u: any) => !u.is_active).length,
        byRole: {
          admin: usersInMarket.filter((u: any) => u.role === 'admin').length,
          manager: usersInMarket.filter((u: any) => u.role === 'manager').length,
          employee: usersInMarket.filter((u: any) => u.role === 'employee').length
        }
      },
      urlaub: {
        totalBudgets: marketBudgets.length,
        averageJahresanspruch: marketBudgets.length > 0 
          ? marketBudgets.reduce((sum: number, b: any) => sum + b.jahresanspruch, 0) / marketBudgets.length 
          : 0,
        totalGenommen: marketBudgets.reduce((sum: number, b: any) => sum + b.genommen, 0),
        totalVerplant: marketBudgets.reduce((sum: number, b: any) => sum + b.verplant, 0)
      }
    }

    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Markt-Statistiken:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Markt-Statistiken' 
    })
  }
})

// Alle Markt-Statistiken (nur für Admins)
router.get('/stats/overview', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const markets = db.all('SELECT * FROM markets')
    const allUsers = db.all('SELECT * FROM users')
    const allBudgets = db.all('SELECT * FROM urlaub_budgets')

    const marketStats = markets.map((market: any) => {
      const usersInMarket = allUsers.filter((user: any) => user.market_id === market.id)
      const marketBudgets = allBudgets.filter((budget: any) => 
        usersInMarket.some((user: any) => user.id === budget.user_id)
      )

      return {
        market: {
          id: market.id,
          name: market.name,
          address: market.address,
          phone: market.phone,
          email: market.email
        },
        users: {
          total: usersInMarket.length,
          active: usersInMarket.filter((u: any) => u.is_active).length,
          inactive: usersInMarket.filter((u: any) => !u.is_active).length
        },
        urlaub: {
          totalBudgets: marketBudgets.length,
          averageJahresanspruch: marketBudgets.length > 0 
            ? marketBudgets.reduce((sum: number, b: any) => sum + b.jahresanspruch, 0) / marketBudgets.length 
            : 0
        }
      }
    })

    const totalStats = {
      totalMarkets: markets.length,
      totalUsers: allUsers.length,
      totalActiveUsers: allUsers.filter((u: any) => u.is_active).length,
      totalBudgets: allBudgets.length
    }

    res.json({
      success: true,
      totalStats,
      marketStats
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Markt-Übersicht:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Markt-Übersicht' 
    })
  }
})

export { router as marktRoutes }

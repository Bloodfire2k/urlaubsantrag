import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs' // Änderung: bcryptjs Import hinzugefügt. Grund: Passwort-Hashing für Reset-Funktion
import { db } from '../database'

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

// Middleware für Admin-Berechtigung
const requireAdmin = (req: Request, res: Response, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' })
  }
  next()
}

// Middleware für Manager/Admin-Berechtigung
const requireManagerOrAdmin = (req: Request, res: Response, next: any) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Manager oder Admin-Berechtigung erforderlich' })
  }
  next()
}

// Alle Abteilungen abrufen
router.get('/departments', authenticateToken, (req: Request, res: Response) => {
  try {
    const departments = db.getAllDepartments()
    res.json({
      success: true,
      departments
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Abteilungen:', error)
    res.status(500).json({ error: 'Interner Server-Fehler' })
  }
})

// Alle Benutzer abrufen (gefiltert nach Rolle)
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    let users: any[] = []

    if (req.user.role === 'admin') {
      // Admins sehen alle Benutzer
      users = db.all('SELECT * FROM users ORDER BY created_at DESC')
    } else if (req.user.role === 'manager') {
      // Manager sehen nur Benutzer ihres Marktes
      users = db.all('SELECT * FROM users WHERE market_id = ? ORDER BY created_at DESC', [req.user.marketId])
    } else {
      // Mitarbeiter sehen nur sich selbst
      users = db.all('SELECT * FROM users WHERE id = ?', [req.user.userId])
    }

    // Passwort-Hashes entfernen
    const safeUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      market_id: user.market_id,
      department: user.department,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    }))

    res.json({
      success: true,
      users: safeUsers
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Benutzer' 
    })
  }
})

// Benutzer nach ID abrufen
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    
    // Benutzer können nur ihre eigenen Daten sehen, Admins/Manager alle
    if (req.user.role === 'employee' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    const user = db.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Passwort-Hash entfernen
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      market_id: user.market_id,
      department: user.department,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    }

    res.json({
      success: true,
      user: safeUser
    })

  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen des Benutzers' 
    })
  }
})

// Benutzer aktualisieren
router.put('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    
    // Benutzer können nur ihre eigenen Daten bearbeiten, Admins alle
    if (req.user.role === 'employee' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
    }

    // Manager können nur Benutzer ihres Marktes bearbeiten
    if (req.user.role === 'manager') {
      const user = db.getUserById(userId)
      if (!user || user.market_id !== req.user.marketId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diesen Benutzer' })
      }
    }

    const { 
      email, 
      fullName, 
      department, 
      is_active, 
      role, 
      market_id 
    } = req.body

    // Nur Admins können Rollen und Märkte ändern
    if (req.user.role !== 'admin') {
      delete req.body.role
      delete req.body.market_id
    }

    // Aktualisierungen vorbereiten
    const updates: any = {}
    if (email !== undefined) updates.email = email
    if (fullName !== undefined) updates.fullName = fullName
    if (department !== undefined) updates.department = department
    if (is_active !== undefined) updates.is_active = is_active
    if (role !== undefined) updates.role = role
    if (market_id !== undefined) updates.market_id = market_id

    // Benutzer aktualisieren
    const updatedUser = db.updateUser(userId, updates)
    if (!updatedUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Aktualisierten Benutzer zurückgeben (ohne Passwort)
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      market_id: updatedUser.market_id,
      department: updatedUser.department,
      is_active: updatedUser.is_active,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    }

    res.json({
      success: true,
      message: 'Benutzer erfolgreich aktualisiert',
      user: safeUser
    })

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzers:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Aktualisieren des Benutzers' 
    })
  }
})

// Benutzer DAUERHAFT löschen (nur für Admins) - MUSS VOR /:id stehen!
router.delete('/:id/permanent-delete', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    
    // Admin kann sich nicht selbst löschen
    if (req.user.userId === userId) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' })
    }

    const user = db.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Benutzer dauerhaft löschen
    const success = db.deleteUser(userId)
    if (!success) {
      return res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' })
    }

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'DELETE_USER_PERMANENT',
      table_name: 'users',
      record_id: userId,
      old_values: JSON.stringify(user),
      new_values: null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: 'Benutzer erfolgreich dauerhaft gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim dauerhaften Löschen des Benutzers:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim dauerhaften Löschen des Benutzers' 
    })
  }
})

// Benutzer deaktivieren (nur für Admins)
router.delete('/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    
    // Admin kann sich nicht selbst deaktivieren
    if (req.user.userId === userId) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst deaktivieren' })
    }

    const user = db.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Benutzer deaktivieren statt löschen
    const updatedUser = db.updateUser(userId, { is_active: false })
    if (!updatedUser) {
      return res.status(500).json({ error: 'Fehler beim Deaktivieren des Benutzers' })
    }

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'DEACTIVATE_USER',
      table_name: 'users',
      record_id: userId,
      old_values: JSON.stringify(user),
      new_values: JSON.stringify(updatedUser),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: 'Benutzer erfolgreich deaktiviert'
    })

  } catch (error) {
    console.error('Fehler beim Deaktivieren des Benutzers:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Deaktivieren des Benutzers' 
    })
  }
})

// Benutzer reaktivieren (nur für Admins)
router.post('/:id/reactivate', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    
    const user = db.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    if (user.is_active) {
      return res.status(400).json({ error: 'Benutzer ist bereits aktiv' })
    }

    const updatedUser = db.updateUser(userId, { is_active: true })
    if (!updatedUser) {
      return res.status(500).json({ error: 'Fehler beim Reaktivieren des Benutzers' })
    }

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: req.user.userId,
      action: 'REACTIVATE_USER',
      table_name: 'users',
      record_id: userId,
      old_values: JSON.stringify(user),
      new_values: JSON.stringify(updatedUser),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.json({
      success: true,
      message: 'Benutzer erfolgreich reaktiviert'
    })

  } catch (error) {
    console.error('Fehler beim Reaktivieren des Benutzers:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Reaktivieren des Benutzers' 
    })
  }
})

// Benutzer nach Markt abrufen
router.get('/market/:marketId', authenticateToken, requireManagerOrAdmin, (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.marketId)
    
    // Manager können nur Benutzer ihres eigenen Marktes sehen
    if (req.user.role === 'manager' && req.user.marketId !== marketId) {
      return res.status(403).json({ error: 'Keine Berechtigung für diesen Markt' })
    }

    const users = db.getUsersByMarket(marketId)
    
    // Passwort-Hashes entfernen
    const safeUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      market_id: user.market_id,
      department: user.department,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    }))

    res.json({
      success: true,
      users: safeUsers
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Markt-Benutzer:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Markt-Benutzer' 
    })
  }
})

// Benutzer-Statistiken (nur für Admins und Manager)
router.get('/stats/overview', authenticateToken, requireManagerOrAdmin, (req: Request, res: Response) => {
  try {
    let users = db.all('SELECT * FROM users')
    
    // Manager sehen nur Benutzer ihres Marktes
    if (req.user.role === 'manager') {
      users = users.filter((user: any) => user.market_id === req.user.marketId)
    }

    const stats = {
      total: users.length,
      active: users.filter((u: any) => u.is_active).length,
      inactive: users.filter((u: any) => !u.is_active).length,
      byRole: {
        admin: users.filter((u: any) => u.role === 'admin').length,
        manager: users.filter((u: any) => u.role === 'manager').length,
        employee: users.filter((u: any) => u.role === 'employee').length
      },
      byMarket: {} as any
    }

    // Gruppiere nach Märkten
    users.forEach((user: any) => {
      const market = db.getMarketById(user.market_id)
      if (market) {
        if (!stats.byMarket[market.name]) {
          stats.byMarket[market.name] = 0
        }
        stats.byMarket[market.name]++
      }
    })

    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer-Statistiken:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Abrufen der Benutzer-Statistiken' 
    })
  }
})

// Änderung: Passwort-Reset-Route hinzugefügt. Grund: Admin kann Mitarbeiter-Passwörter zurücksetzen
// WICHTIG: Muss vor /:id Route stehen, da spezifischere Routen zuerst definiert werden müssen
router.put('/:id/password', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Passwort ist erforderlich' })
    }

    // Benutzer existiert prüfen
    const existingUser = db.get('SELECT * FROM users WHERE id = ?', [id])
    if (!existingUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10)

    // Passwort in Datenbank aktualisieren
    db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [hashedPassword, id])

    res.json({ 
      success: true, 
      message: 'Passwort erfolgreich aktualisiert',
      newPassword: password // Für Admin-Anzeige
    })

  } catch (error) {
    console.error('Fehler beim Passwort-Reset:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Passwort-Reset' 
    })
  }
})

// Änderung: Benutzer-Update-Route hinzugefügt. Grund: Admin kann Mitarbeiterdaten bearbeiten
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { fullName, email, role, market_id, department, is_active } = req.body

    // Benutzer existiert prüfen
    const existingUser = db.get('SELECT * FROM users WHERE id = ?', [id])
    if (!existingUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Benutzer aktualisieren
    db.run(`UPDATE users SET 
      full_name = ?, 
      email = ?, 
      role = ?, 
      market_id = ?, 
      department = ?, 
      is_active = ?, 
      updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`, 
      [fullName, email, role, market_id, department, is_active, id])

    // Aktualisierten Benutzer zurückgeben
    const updatedUser = db.get('SELECT * FROM users WHERE id = ?', [id])

    res.json({ 
      success: true, 
      message: 'Benutzer erfolgreich aktualisiert',
      user: updatedUser
    })

  } catch (error) {
    console.error('Fehler beim Benutzer-Update:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Benutzer-Update' 
    })
  }
})

export { router as userRoutes }

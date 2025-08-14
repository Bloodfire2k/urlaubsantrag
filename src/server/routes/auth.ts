import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../database'

const router = Router()

// JWT Secret (in Produktion sollte das in einer Umgebungsvariable gespeichert werden)
const JWT_SECRET = process.env.JWT_SECRET || 'ihr-super-geheimer-jwt-schluessel-2024'

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Benutzername und Passwort sind erforderlich' 
      })
    }

    // Benutzer in der Datenbank suchen
    const user = db.getUserByUsername(username)
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'Ungültige Anmeldedaten oder Benutzer deaktiviert' 
      })
    }

    // Passwort überprüfen
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Ungültige Anmeldedaten' 
      })
    }

    // JWT Token erstellen
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        marketId: user.market_id 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'users',
      record_id: user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    // Benutzer-Informationen zurückgeben (ohne Passwort)
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      marketId: user.market_id,
      department: user.department
    }

    res.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      token,
      user: userInfo
    })

  } catch (error) {
    console.error('Login-Fehler:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Login' 
    })
  }
})

// Registrierung (nur für Admins)
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Prüfe ob der aktuelle Benutzer ein Admin ist
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Kein Token bereitgestellt' })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Prüfe Token-Format
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Ungültiges Token-Format' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Nur Admins können neue Benutzer erstellen' })
    }

    const { 
      username, 
      email, 
      fullName, 
      password, 
      role, 
      marketId, 
      department,
      urlaubsanspruch 
    } = req.body

    // Validierung
    if (!username || !email || !fullName || !password || !role || !marketId) {
      return res.status(400).json({ 
        error: 'Alle Pflichtfelder müssen ausgefüllt werden' 
      })
    }

    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ 
        error: 'Ungültige Rolle' 
      })
    }

    // Prüfe ob Benutzername oder E-Mail bereits existiert
    const existingUser = db.getUserByUsername(username)
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Benutzername bereits vergeben' 
      })
    }

    // Prüfe ob Markt existiert
    const market = db.getMarketById(marketId)
    if (!market) {
      return res.status(400).json({ 
        error: 'Markt nicht gefunden' 
      })
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 12)

    // Neuen Benutzer erstellen
    const newUser = db.addUser({
      username,
      email,
      fullName: fullName,
      password_hash: passwordHash,
      role: role as 'admin' | 'manager' | 'employee',
      market_id: marketId,
      department,
      is_active: true
    })

    // Urlaubsbudget für das aktuelle Jahr erstellen
    const currentYear = new Date().getFullYear()
    const jahresanspruch = urlaubsanspruch || (role === 'admin' ? 30 : 25)
    const defaultBudget = {
      mitarbeiterId: newUser.id,
      jahr: currentYear,
      jahresanspruch: jahresanspruch,
      genommen: 0,
      verplant: 0,
      uebertrag: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Urlaubsbudget in der Datenbank speichern
    db.addUrlaubBudget(defaultBudget)

    // Audit-Log erstellen
    const auditLog = {
      id: 0,
      user_id: decoded.userId,
      action: 'CREATE_USER',
      table_name: 'users',
      record_id: newUser.id,
      new_values: JSON.stringify(newUser),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    }

    res.status(201).json({
      success: true,
      message: 'Benutzer erfolgreich erstellt',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        marketId: newUser.market_id,
        department: newUser.department
      }
    })

  } catch (error) {
    console.error('Registrierungs-Fehler:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler bei der Registrierung' 
    })
  }
})

// Token validieren
router.get('/verify', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Kein Token bereitgestellt' })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Benutzer-Informationen aus der Datenbank holen
    const user = db.getUserById(decoded.userId)
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden oder deaktiviert' })
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        marketId: user.market_id,
        department: user.department
      }
    })

  } catch (error) {
    res.status(401).json({ error: 'Ungültiger Token' })
  }
})

// Passwort ändern
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Kein Token bereitgestellt' })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Aktuelles und neues Passwort sind erforderlich' 
      })
    }

    const user = db.getUserById(decoded.userId)
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }

    // Aktuelles Passwort überprüfen
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Aktuelles Passwort ist falsch' })
    }

    // Neues Passwort hashen
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Passwort aktualisieren
    const updatedUser = db.updateUser(user.id, { password_hash: newPasswordHash })
    if (!updatedUser) {
      return res.status(500).json({ error: 'Fehler beim Aktualisieren des Passworts' })
    }

    res.json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    })

  } catch (error) {
    console.error('Passwort-Änderungs-Fehler:', error)
    res.status(500).json({ 
      error: 'Interner Server-Fehler beim Ändern des Passworts' 
    })
  }
})

export { router as authRoutes }

import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../database'
import { getUsersRepo } from '../data/usersRepo'
import { prisma } from '../../lib/prisma'
import { hashPassword } from '../utils/password'

const router = Router()

// JWT Secret (in Produktion sollte das in einer Umgebungsvariable gespeichert werden)
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required') })()

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, email, usernameOrEmail, password } = req.body || {};
    const idf = (username || email || usernameOrEmail || '').trim();
    if (!idf || !password) return res.status(400).json({ error:'missing_credentials' });
    const usersRepo = getUsersRepo();
    const user = await usersRepo.findByUsernameOrEmail(idf);
    if (!user) { console.warn('[auth] user_not_found', idf); return res.status(401).json({ error:'unauthorized' }); }
    const ok = await usersRepo.verify(password, user.passwordHash);
    if (!ok) { console.warn('[auth] wrong_password userId=', user.id); return res.status(401).json({ error:'unauthorized' }); }

    // JWT Token erstellen
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        marketId: user.market_id || 1
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
      fullName: user.fullName || user.username,
      role: user.role,
      marketId: user.market_id || 1,
      department: user.department || 'Unbekannt'
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
      password,
      role,
      fullName,
      department,
      // neu/flexibel:
      marketId: rawMarketId,
      marketName: rawMarketName,
      market: rawMarketFallback // falls Frontend "market" sendet
    } = req.body as any

    // Market auflösen: bevorzugt ID, sonst Name
    let marketId: number | null = null
    const tryId = rawMarketId ?? rawMarketFallback
    if (tryId !== undefined && tryId !== null && String(tryId).trim() !== '') {
      const n = Number(tryId)
      if (!Number.isNaN(n)) marketId = n
    }

    let market = null as null | { id: number }
    if (marketId != null) {
      market = await prisma.market.findUnique({ where: { id: marketId } })
    } else if (rawMarketName && String(rawMarketName).trim() !== '') {
      market = await prisma.market.findFirst({ where: { name: String(rawMarketName).trim() } })
    }

    if (!market) {
      return res.status(400).json({ error: 'Markt nicht gefunden' })
    }

    // Validierung
    if (!username || !email || !fullName || !password || !role || !department) {
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
    const usersRepo = getUsersRepo()
    const existingUser = await usersRepo.findByUsernameOrEmail(username)
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Benutzername bereits vergeben' 
      })
    }

    // Passwort hashen
    const passwordHash = await hashPassword(password, 12)

    // Neuen Benutzer erstellen
    const created = await usersRepo.create({
      username,
      email,
      fullName,
      department,
      role: role as 'admin' | 'manager' | 'employee',
      passwordHash,
      marketId: market.id,
    })

    res.json({ ok: true, user: { id: created.id } })

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
    const isValidPassword = await password.compare(currentPassword, user.password_hash)
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Aktuelles Passwort ist falsch' })
    }

    // Neues Passwort hashen
          const newPasswordHash = await password.hash(newPassword, 12)

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

import { prisma } from '../../lib/prisma';
import express from 'express';

const diag = express.Router();
diag.get('/_diag-db', async (_req, res) => {
  const isPg =
    process.env.NODE_ENV === 'production' &&
    (process.env.DB_TYPE || '').toLowerCase() === 'postgres';
  let count: number | null = null;
  if (isPg) {
    try { count = await prisma.user.count(); } catch { count = -1; }
  }
  res.json({ mode: isPg ? 'postgres' : 'json', count });
});

// Router export beibehalten; die Diag-Route unter /api/auth/_diag-db verfügbar machen:
router.use(diag);

export { router as authRoutes }

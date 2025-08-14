/**
 * Production Server für Coolify Deployment
 * 
 * Optimiert für Container-Umgebung mit PostgreSQL
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { prisma } from '../lib/prisma'

// Routen importieren
import { authRoutes } from './routes/auth'
import { usersPrismaRoutes } from './routes/users-prisma'
import { urlaubPrismaRoutes } from './routes/urlaub-prisma'
import { marketsPrismaRoutes } from './routes/markets-prisma'

const app = express()
const PORT = process.env.PORT || 3000

// Sicherheits-Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}))

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}))

// Rate Limiting für Production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000, // Max 1000 Requests pro IP
  message: 'Zu viele Anfragen von dieser IP, versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Static files (Frontend)
app.use(express.static(path.join(__dirname, '../../dist')))

// Datenbank-Initialisierung
async function initDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ SQLite-Datenbankverbindung erfolgreich')
    
    // Teste Verbindung
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Datenbankverbindung getestet')
    
  } catch (error) {
    console.error('❌ Datenbankverbindungsfehler:', error)
    process.exit(1)
  }
}

// API Routes - Prisma-basierte Endpunkte
app.use('/api/auth', authRoutes)
app.use('/api/users', usersPrismaRoutes)
app.use('/api/urlaub', urlaubPrismaRoutes) 
app.use('/api/markets', marketsPrismaRoutes)

// Health Check mit Datenbankstatus
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected (SQLite)',
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Datenbankverbindung fehlgeschlagen'
    })
  }
})

// Alle anderen Routen an Frontend weiterleiten (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'))
})

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err)
  res.status(500).json({ 
    error: 'Interner Server-Fehler',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schiefgelaufen'
  })
})

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Server wird heruntergefahren...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🔄 Server wird heruntergefahren...')
  await prisma.$disconnect()
  process.exit(0)
})

// Server starten
app.listen(PORT, async () => {
  console.log(`🚀 Production Server läuft auf Port ${PORT}`)
  console.log(`🌍 Umgebung: ${process.env.NODE_ENV}`)
  console.log(`💾 Datenbank: SQLite`)
  
  await initDatabase()
  
  console.log(`✅ Urlaubsantrag-System bereit!`)
})

export { app, prisma }

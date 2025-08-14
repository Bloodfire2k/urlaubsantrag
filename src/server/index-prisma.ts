/**
 * Neuer Server mit Prisma-Unterstützung
 * 
 * Läuft parallel zum alten Server und bietet neue Prisma-basierte APIs
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { prisma } from '../lib/prisma'

// Neue Prisma-basierte Routen
import { authRoutes } from './routes/auth' // Bleibt gleich (JWT)
import { usersPrismaRoutes } from './routes/users-prisma'
import { urlaubPrismaRoutes } from './routes/urlaub-prisma'
import { marketsPrismaRoutes } from './routes/markets-prisma'

const app = express()
const PORT = process.env.PORT || 3002 // Anderer Port für Tests

// Sicherheits-Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ihre-domain.de'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173', 'http://192.168.2.158:3000'],
  credentials: true
}))

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: 1000, // Max 1000 Requests pro IP
  message: 'Zu viele Anfragen von dieser IP, versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Prisma-Verbindung testen
async function initDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Prisma-Datenbankverbindung erfolgreich')
    
    // Teste eine einfache Abfrage
    const marketCount = await prisma.market.count()
    console.log(`📊 ${marketCount} Märkte in der Datenbank`)
    
  } catch (error) {
    console.error('❌ Prisma-Verbindungsfehler:', error)
    console.log('💡 Führe zuerst "npm run db:import" aus')
  }
}

// API Routes - Neue Prisma-basierte Endpunkte
app.use('/api/auth', authRoutes) // Weiterhin JSON-basiert
app.use('/api/users', usersPrismaRoutes)
app.use('/api/urlaub', urlaubPrismaRoutes) 
app.use('/api/markets', marketsPrismaRoutes)

// Health Check mit Prisma-Status
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected (Prisma)',
      engine: 'SQLite'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected (Prisma)',
      error: 'Datenbankverbindung fehlgeschlagen'
    })
  }
})

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err)
  res.status(500).json({ 
    error: 'Interner Server-Fehler',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schiefgelaufen'
  })
})

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nicht gefunden' })
})

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Prisma-Server wird heruntergefahren...')
  await prisma.$disconnect()
  process.exit(0)
})

// Server starten
app.listen(PORT, async () => {
  console.log(`🚀 Prisma-Server läuft auf Port ${PORT}`)
  console.log(`🔐 API verfügbar unter: http://localhost:${PORT}/api`)
  console.log(`💾 Datenbank: SQLite mit Prisma ORM`)
  
  await initDatabase()
})

export { app, prisma }

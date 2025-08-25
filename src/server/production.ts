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

// Bootstrap imports
import { migrateAndSeedPostgres } from './bootstrap-postgres'

// Prisma-Routen importieren
import { usersPrismaRoutes } from './routes/users-prisma'
import { urlaubPrismaRoutes } from './routes/urlaub-prisma'
import { marketsPrismaRoutes } from './routes/markets-prisma'

// JSON-basierte Routen (nur für Fallback)
import { authRoutes } from './routes/auth'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.set('trust proxy', 1) // wichtig hinter Traefik

// Sicherheits-Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}))

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://urlaub.myfire.cloud'
app.use(cors({ origin: allowedOrigin, credentials: true }))

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
    const dbType = process.env.DB_TYPE ?? 'postgres';
    const hasDBUrl = !!process.env.DATABASE_URL;
    
    console.log('[boot]', { 
      NODE_ENV: process.env.NODE_ENV, 
      DB_TYPE: dbType, 
      hasDBUrl 
    });
    
    if (dbType === 'postgres' && hasDBUrl) {
      console.log('🔄 PostgreSQL-Datenbank wird initialisiert...')
      await migrateAndSeedPostgres()
      console.log('✅ PostgreSQL-Datenbank bereit')
    } else if (dbType === 'sqlite') {
      console.log('🔄 SQLite-Datenbank wird initialisiert...')
      // Für Tests verwenden wir SQLite
      console.log('✅ SQLite-Datenbank bereit')
    } else {
      console.error('❌ Datenbank-URL fehlt oder DB_TYPE ist nicht konfiguriert')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Datenbankverbindungsfehler:', error)
    process.exit(1)
  }
}

// API Routes - Prisma-basierte Endpunkte für PostgreSQL
app.use('/api/auth', authRoutes) // Auth bleibt JSON-basiert (JWT)
app.use('/api/users', usersPrismaRoutes)
app.use('/api/urlaub', urlaubPrismaRoutes) 
app.use('/api/markets', marketsPrismaRoutes)

// Health Check
app.get('/health', (_req, res) => res.status(200).send('OK'))

app.get('/api/health', async (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL via Prisma',
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'error',
      error: 'Server-Fehler' 
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
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🔄 Server wird heruntergefahren...')
  process.exit(0)
})

// Server starten
async function startServer() {
  await initDatabase()
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Production Server läuft auf Port ${PORT}`)
    console.log(`📊 Verwendet PostgreSQL-Datenbank via Prisma`)
  })
}

startServer().catch(console.error)

export { app }

/**
 * Production Server für Coolify Deployment
 * 
 * Optimiert für Container-Umgebung mit PostgreSQL
 * Keine Fallbacks - nur PostgreSQL + JSON-Responses
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

// 1) Security + Parser
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGIN?.split(',') ?? 'https://urlaub.myfire.cloud', 
  credentials: true 
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate Limiting für Production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000, // Max 1000 Requests pro IP
  message: 'Zu viele Anfragen von dieser IP, versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Datenbank-Initialisierung - Nur PostgreSQL
async function initDatabase() {
  try {
    const dbType = process.env.DB_TYPE ?? 'postgres';
    const hasDBUrl = !!process.env.DATABASE_URL;
    
    console.log('[boot]', { 
      NODE_ENV: process.env.NODE_ENV, 
      DB_TYPE: process.env.DB_TYPE, 
      hasDBUrl: !!process.env.DATABASE_URL 
    });
    
    if (dbType !== 'postgres' || !hasDBUrl) {
      console.error('❌ PostgreSQL-Datenbank-URL fehlt oder DB_TYPE ist nicht postgres')
      process.exit(1)
    }
    
    console.log('🔄 PostgreSQL-Datenbank wird initialisiert...')
    await migrateAndSeedPostgres()
    console.log('✅ PostgreSQL-Datenbank bereit')
  } catch (error) {
    console.error('❌ Datenbankverbindungsfehler:', error)
    process.exit(1)
  }
}

// 2) API-Routen VOR static
app.use('/api/auth', authRoutes)
app.use('/api/users', usersPrismaRoutes)
app.use('/api/urlaub', urlaubPrismaRoutes) 
app.use('/api/markets', marketsPrismaRoutes)

// Health Check
app.get('/health', (_req, res) => res.status(200).send('OK'))

// 3) JSON-404 für unbekannte /api
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'not_found' }))

// 4) Einheitlicher JSON-Error-Handler NUR für /api
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api-error]', err);
  const code = err?.status || err?.statusCode || 500;
  res.status(code).json({ error: 'internal', message: err?.message ?? 'internal_error' });
});

// 5) Static + SPA-Fallback NACH den /api-Handlern
app.use(express.static(path.join(__dirname, '../../dist')))
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'))
})

// Global Error Handler (für alle anderen Routen)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err)
  res.status(500).json({ 
    error: 'internal_error',
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

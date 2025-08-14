import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { db } from './database'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { urlaubRoutes } from './routes/urlaub'
import { marktRoutes } from './routes/markets'

const app = express()
const PORT = process.env.PORT || 3001

// Sicherheits-Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ihre-domain.de'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 'http://localhost:5173', 'http://192.168.2.158:3000'],
  credentials: true
}))

// Rate Limiting - Änderung: Gelockerte Limits für Admin-Anwendung. Grund: Zu strenge Limits blockieren normale Nutzung
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute (statt 15)
  max: 1000, // Max 1000 Requests pro IP (statt 100)
  message: 'Zu viele Anfragen von dieser IP, versuchen Sie es später erneut.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use('/api/', limiter)

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Datenbank initialisieren
db.init()

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/urlaub', urlaubRoutes)
app.use('/api/markets', marktRoutes)

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: db.isConnected() ? 'connected' : 'disconnected'
  })
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
process.on('SIGINT', () => {
  console.log('\n🔄 Server wird heruntergefahren...')
  db.close()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`)
  console.log(`📊 Datenbank: ${db.isConnected() ? 'Verbunden' : 'Nicht verbunden'}`)
  console.log(`🔐 API verfügbar unter: http://localhost:${PORT}/api`)
})

export { app, db }

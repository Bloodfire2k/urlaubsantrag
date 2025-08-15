import { createApp } from './config/app'
import { db } from './database'
import { setupGracefulShutdown } from './utils/shutdown'

// Konfiguration
const PORT = process.env.PORT || 3002 // Änderung: Port auf 3002 geändert. Grund: Vermeidung von Konflikten mit Vite (3000) und anderen Services

// Datenbank initialisieren
db.init()

// Express App erstellen
const app = createApp()

// Graceful Shutdown einrichten
setupGracefulShutdown()

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`)
  console.log(`📊 Datenbank: ${db.isConnected() ? 'Verbunden' : 'Nicht verbunden'}`)
  console.log(`🔐 API verfügbar unter: http://localhost:${PORT}/api`)
})

export { app, db }
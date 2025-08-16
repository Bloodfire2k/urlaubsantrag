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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`)
  console.log(`📊 Datenbank: ${db.isConnected() ? 'Verbunden' : 'Nicht verbunden'}`)
  console.log(`🔐 API verfügbar unter:`)
  console.log(`   - Lokal: http://localhost:${PORT}/api`)
  console.log(`   - Netzwerk: http://192.168.50.212:${PORT}/api`)
  console.log(`   - Netzwerk: http://10.5.0.2:${PORT}/api`)
})

export { app, db }
import fs from 'fs'
import path from 'path'
import { db } from './database'
import { password } from './utils/password'

/**
 * Setzt JSON-DB zurück wenn nötig (nur Production mit entsprechenden ENV-Vars)
 */
export async function resetJsonDbIfNeeded(): Promise<void> {
  // Bedingungen prüfen
  if (process.env.NODE_ENV !== 'production') return
  if (process.env.JSON_DB_RESET_ON_DEPLOY !== '1') return

  const dataPath = path.join(process.cwd(), 'data')
  const seedMarkerPath = path.join(dataPath, '.seeded')
  
  // Once-Schutz: Wenn Marker existiert und nicht FORCE_RESET gesetzt
  if (fs.existsSync(seedMarkerPath) && process.env.JSON_DB_FORCE_RESET !== '1') {
    console.log('ℹ️ Reset übersprungen - bereits ausgeführt (Marker vorhanden)')
    return
  }

  try {
    console.log('🔄 JSON-DB wird zurückgesetzt...')
    
    // JSON-Dateien leeren/neu initialisieren
    const jsonFiles = ['users.json', 'markets.json', 'urlaub_budgets.json', 'urlaub_antraege.json', 'audit_logs.json']
    
    for (const fileName of jsonFiles) {
      const filePath = path.join(dataPath, fileName)
      fs.writeFileSync(filePath, '[]', 'utf8')
      console.log(`  ✓ ${fileName} zurückgesetzt`)
    }
    
    // Marker-Datei löschen (falls vorhanden)
    if (fs.existsSync(seedMarkerPath)) {
      fs.unlinkSync(seedMarkerPath)
      console.log('  ✓ Seed-Marker gelöscht')
    }
    
    console.log('✅ JSON-DB erfolgreich zurückgesetzt')
  } catch (error) {
    console.error('❌ Fehler beim JSON-DB Reset:', error)
    throw error
  }
}

/**
 * Erstellt Admin-User wenn nötig (nur Production mit entsprechenden ENV-Vars)
 */
export async function seedAdminIfNeeded(): Promise<void> {
  // Bedingungen prüfen
  if (process.env.NODE_ENV !== 'production') return
  if (process.env.JSON_DB_RESET_ON_DEPLOY !== '1') return

  const dataPath = path.join(process.cwd(), 'data')
  const seedMarkerPath = path.join(dataPath, '.seeded')

  try {
    console.log('🌱 Admin-User wird erstellt...')
    
    // Admin-Credentials aus ENV oder Defaults
    const username = process.env.ADMIN_USERNAME || 'admin'
    const plainPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const email = process.env.ADMIN_EMAIL || 'admin@example.com'
    
    // Passwort hashen
    const passwordHash = await password.hash(plainPassword, 12)
    
    // Erstelle Markt falls nötig
    let market = db.getMarketById(1)
    if (!market) {
      market = db.addMarket({
        name: 'Hauptmarkt',
        address: 'Hauptstraße 1, 12345 Stadt',
        email: 'info@unternehmen.de'
      })
      console.log(`  ✓ Standard-Markt erstellt (ID: ${market.id})`)
    }
    
    // Admin-User erstellen
    const adminUser = db.addUser({
      username: username,
      email: email,
      fullName: 'Administrator',
      password_hash: passwordHash,
      role: 'admin',
      market_id: market.id,
      is_active: true
    })
    
    console.log(`  ✓ Admin-User erstellt: ${username} (ID: ${adminUser.id})`)
    
    // Urlaubsbudget für Admin erstellen
    const currentYear = new Date().getFullYear()
    db.addUrlaubBudget({
      mitarbeiterId: adminUser.id,
      jahr: currentYear,
      jahresanspruch: 30,
      genommen: 0,
      verplant: 0,
      uebertrag: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    console.log(`  ✓ Urlaubsbudget für Admin erstellt (Jahr: ${currentYear})`)
    
    // Marker-Datei erstellen
    fs.writeFileSync(seedMarkerPath, new Date().toISOString(), 'utf8')
    console.log('  ✓ Seed-Marker erstellt')
    
    console.log('✅ Admin-User erfolgreich erstellt')
  } catch (error) {
    console.error('❌ Fehler beim Admin-User Seeding:', error)
    throw error
  }
}

#!/usr/bin/env tsx
/**
 * Einmalige Migration der JSON-Daten zu SQLite/Prisma
 * 
 * Dieses Script:
 * - Liest alle JSON-Dateien aus data/
 * - Löscht bestehende Datensätze (idempotent)
 * - Importiert Markets, Users und Vacations
 * - Mappt Feldnamen korrekt
 * - Beendet sich mit Fehlercode bei Validierungsfehlern
 */

import { PrismaClient, VacationStatus } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Interfaces für JSON-Datenstrukturen
interface JsonMarket {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  created_at?: string
  updated_at?: string
}

interface JsonUser {
  id: number
  username: string
  email: string
  fullName: string
  password_hash: string
  role: string
  market_id: number
  department: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface JsonVacation {
  id: number
  mitarbeiterId: number  // wird zu userId
  startDatum: string     // wird zu startDate
  endDatum: string       // wird zu endDate
  status: string
  bemerkung?: string     // wird zu description
  created_at?: string
  updated_at?: string
}

/**
 * Status-Mapping von alten JSON-Werten zu Prisma Enum
 */
function mapVacationStatus(oldStatus: string): VacationStatus {
  switch (oldStatus.toLowerCase()) {
    case 'pending':
    case 'offen':
      return VacationStatus.offen
    case 'approved':
    case 'genehmigt':
      return VacationStatus.genehmigt
    case 'rejected':
    case 'abgelehnt':
      return VacationStatus.abgelehnt
    default:
      console.warn(`⚠️ Unbekannter Status: ${oldStatus}, verwende 'offen'`)
      return VacationStatus.offen
  }
}

/**
 * Validiert Datum und konvertiert zu Date-Objekt
 */
function parseDate(dateStr: string, context: string): Date {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    throw new Error(`Ungültiges Datum in ${context}: ${dateStr}`)
  }
  return date
}

/**
 * Lädt und validiert JSON-Datei
 */
function loadJsonFile<T>(filename: string): T[] {
  const filePath = join(process.cwd(), 'data', filename)
  console.log(`📖 Lade ${filePath}...`)
  
  try {
    const content = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)
    
    if (!Array.isArray(data)) {
      throw new Error(`${filename} enthält kein Array`)
    }
    
    console.log(`✅ ${data.length} Einträge aus ${filename} geladen`)
    return data
  } catch (error) {
    console.error(`❌ Fehler beim Laden von ${filename}:`, error)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Starte JSON-zu-SQLite Migration...')
  
  try {
    // 1. JSON-Daten laden
    console.log('\n📋 Lade JSON-Dateien...')
    const marketsJson = loadJsonFile<JsonMarket>('markets.json')
    const usersJson = loadJsonFile<JsonUser>('users.json')
    const vacationsJson = loadJsonFile<JsonVacation>('urlaub_antraege.json')

    // 2. Bestehende Daten löschen (idempotent)
    // 2. Datenbankverbindung testen
    console.log('\n🔗 Teste Datenbankverbindung...')
    await prisma.$connect()
    console.log('✅ Datenbankverbindung erfolgreich')

    console.log('\n🗑️ Lösche bestehende Daten...')
    const deletedVacations = await prisma.vacation.deleteMany()
    const deletedUsers = await prisma.user.deleteMany()
    const deletedMarkets = await prisma.market.deleteMany()
    console.log(`✅ Gelöscht: ${deletedVacations.count} Urlaube, ${deletedUsers.count} Benutzer, ${deletedMarkets.count} Märkte`)

    // 3. Markets importieren
    console.log('\n🏪 Importiere Märkte...')
    const marketData = marketsJson.map(market => ({
      id: market.id,
      name: market.name,
      address: market.address || null,
      phone: market.phone || null,
      email: market.email || null,
      createdAt: market.created_at ? new Date(market.created_at) : new Date(),
      updatedAt: market.updated_at ? new Date(market.updated_at) : new Date()
    }))

    await prisma.market.createMany({
      data: marketData,
      skipDuplicates: true
    })
    console.log(`✅ ${marketData.length} Märkte importiert`)

    // 4. Users importieren
    console.log('\n👥 Importiere Benutzer...')
    const userData = usersJson.map(user => {
      // Validierung
      if (!user.market_id) {
        throw new Error(`Benutzer ${user.fullName} hat keine market_id`)
      }
      if (!marketsJson.find(m => m.id === user.market_id)) {
        throw new Error(`Benutzer ${user.fullName} verweist auf unbekannten Markt ${user.market_id}`)
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        passwordHash: user.password_hash,
        role: user.role,
        marketId: user.market_id,
        department: user.department,
        isActive: user.is_active,
        createdAt: user.created_at ? new Date(user.created_at) : new Date(),
        updatedAt: user.updated_at ? new Date(user.updated_at) : new Date()
      }
    })

    await prisma.user.createMany({
      data: userData,
      skipDuplicates: true
    })
    console.log(`✅ ${userData.length} Benutzer importiert`)

    // 5. Vacations importieren
    console.log('\n🏖️ Importiere Urlaubsanträge...')
    const vacationData = vacationsJson.map(vacation => {
      // Validierung
      if (!usersJson.find(u => u.id === vacation.mitarbeiterId)) {
        throw new Error(`Urlaubsantrag ${vacation.id} verweist auf unbekannten Benutzer ${vacation.mitarbeiterId}`)
      }

      return {
        id: vacation.id,
        userId: vacation.mitarbeiterId,
        startDate: parseDate(vacation.startDatum, `Urlaubsantrag ${vacation.id} Startdatum`),
        endDate: parseDate(vacation.endDatum, `Urlaubsantrag ${vacation.id} Enddatum`),
        status: mapVacationStatus(vacation.status),
        description: vacation.bemerkung || null,
        createdAt: vacation.created_at ? new Date(vacation.created_at) : new Date(),
        updatedAt: vacation.updated_at ? new Date(vacation.updated_at) : new Date()
      }
    })

    await prisma.vacation.createMany({
      data: vacationData,
      skipDuplicates: true
    })
    console.log(`✅ ${vacationData.length} Urlaubsanträge importiert`)

    // 6. Validierung der importierten Daten
    console.log('\n🔍 Validiere importierte Daten...')
    const marketCount = await prisma.market.count()
    const userCount = await prisma.user.count()
    const vacationCount = await prisma.vacation.count()

    console.log(`📊 Importierte Datensätze:`)
    console.log(`   Märkte: ${marketCount}`)
    console.log(`   Benutzer: ${userCount}`)
    console.log(`   Urlaubsanträge: ${vacationCount}`)

    if (marketCount !== marketsJson.length) {
      throw new Error(`Märkte-Anzahl stimmt nicht überein: erwartet ${marketsJson.length}, erhalten ${marketCount}`)
    }
    if (userCount !== usersJson.length) {
      throw new Error(`Benutzer-Anzahl stimmt nicht überein: erwartet ${usersJson.length}, erhalten ${userCount}`)
    }
    if (vacationCount !== vacationsJson.length) {
      throw new Error(`Urlaubsanträge-Anzahl stimmt nicht überein: erwartet ${vacationsJson.length}, erhalten ${vacationCount}`)
    }

    console.log('\n🎉 Migration erfolgreich abgeschlossen!')
    console.log('💡 Die Anwendung verwendet jetzt SQLite statt JSON-Dateien')
    
  } catch (error) {
    console.error('\n❌ Migration fehlgeschlagen:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Script ausführen
main().catch((error) => {
  console.error('💥 Unerwarteter Fehler:', error)
  process.exit(1)
})

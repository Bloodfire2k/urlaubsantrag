import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// JSON Dateien laden
const loadJsonFile = (filename: string) => {
  const filePath = path.join(process.cwd(), 'data', filename)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  }
  return []
}

async function main() {
  console.log('🚀 Importiere Daten aus JSON-Dateien...')

  // 1. Märkte importieren
  const markets = loadJsonFile('markets.json')
  console.log(`📍 Importiere ${markets.length} Märkte...`)
  
  for (const market of markets) {
    await prisma.market.upsert({
      where: { id: market.id },
      update: {},
      create: {
        id: market.id,
        name: market.name,
        address: market.address || '',
        phone: market.phone || '',
        email: market.email || ''
      }
    })
  }

  // 2. Benutzer importieren (nur aktive)
  const users = loadJsonFile('users.json')
  const activeUsers = users.filter((u: any) => u.is_active !== false)
  console.log(`👥 Importiere ${activeUsers.length} aktive Benutzer...`)
  
  for (const user of activeUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.full_name,
        passwordHash: user.password_hash,
        role: user.role,
        marketId: user.market_id,
        department: user.department || 'Unbekannt',
        isActive: user.is_active !== false,
        createdAt: new Date(user.created_at || Date.now()),
        updatedAt: new Date(user.updated_at || Date.now())
      }
    })
  }

  // 3. Urlaubs-Budgets importieren (nur für aktive Benutzer)
  const budgets = loadJsonFile('urlaub_budgets.json')
  const activeBudgets = budgets.filter((b: any) => 
    activeUsers.some((u: any) => u.id === b.mitarbeiterId)
  )
  console.log(`💰 Importiere ${activeBudgets.length} Urlaubs-Budgets...`)
  
  for (const budget of activeBudgets) {
    await prisma.urlaubBudget.upsert({
      where: { 
        userId_jahr: {
          userId: budget.mitarbeiterId,
          jahr: budget.jahr
        }
      },
      update: {},
      create: {
        userId: budget.mitarbeiterId,
        jahr: budget.jahr,
        jahresanspruch: budget.jahresanspruch,
        genommen: budget.genommen || 0,
        verplant: budget.verplant || 0,
        uebertrag: budget.uebertrag || 0,
        createdAt: new Date(budget.created_at || Date.now()),
        updatedAt: new Date(budget.updated_at || Date.now())
      }
    })
  }

  // 4. Urlaubsanträge importieren (nur für aktive Benutzer)
  const antraege = loadJsonFile('urlaub_antraege.json')
  const activeAntraege = antraege.filter((a: any) => 
    activeUsers.some((u: any) => u.id === a.mitarbeiterId)
  )
  console.log(`🏖️ Importiere ${activeAntraege.length} Urlaubsanträge...`)
  
  for (const antrag of activeAntraege) {
    // Status mapping
    let status = 'offen'
    if (antrag.status === 'approved') status = 'genehmigt'
    else if (antrag.status === 'rejected') status = 'abgelehnt'
    else if (antrag.status === 'pending') status = 'offen'

    await prisma.urlaubAntrag.upsert({
      where: { id: antrag.id },
      update: {},
      create: {
        id: antrag.id,
        userId: antrag.mitarbeiterId,
        startDatum: new Date(antrag.startDatum),
        endDatum: new Date(antrag.endDatum),
        bemerkung: antrag.bemerkung || '',
        status: status as any,
        genehmigtVon: antrag.genehmigt_von || null,
        genehmigtAm: antrag.genehmigt_am ? new Date(antrag.genehmigt_am) : null,
        createdAt: new Date(antrag.created_at || Date.now()),
        updatedAt: new Date(antrag.updated_at || Date.now())
      }
    })
  }

  console.log('✅ Import erfolgreich abgeschlossen!')
  console.log(`📊 Zusammenfassung:`)
  console.log(`   - ${markets.length} Märkte`)
  console.log(`   - ${activeUsers.length} aktive Benutzer`)
  console.log(`   - ${activeBudgets.length} Budgets`)
  console.log(`   - ${activeAntraege.length} Urlaubsanträge`)
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Import:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


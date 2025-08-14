#!/usr/bin/env tsx
/**
 * Erstellt Demo-Daten für die Urlaubsverwaltung
 * 
 * Erstellt Märkte, Demo-Benutzer und Urlaubsanträge für Tests
 */

import { PrismaClient, VacationStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎭 Erstelle Demo-Daten für Urlaubsverwaltung...')
  
  try {
    // 1. Märkte erstellen
    console.log('\n🏪 Erstelle Märkte...')
    
    const eCenter = await prisma.market.create({
      data: {
        name: 'E-Center',
        address: 'Musterstraße 1, 12345 Musterstadt',
        phone: '+49 123 456789',
        email: 'info@ecenter.de'
      }
    })

    const edeka = await prisma.market.create({
      data: {
        name: 'Edeka',
        address: 'Beispielweg 15, 54321 Beispielstadt', 
        phone: '+49 987 654321',
        email: 'info@edeka.de'
      }
    })

    console.log(`✅ Märkte erstellt: ${eCenter.name} (ID: ${eCenter.id}), ${edeka.name} (ID: ${edeka.id})`)

    // 2. Demo-Benutzer erstellen
    console.log('\n👥 Erstelle Demo-Benutzer...')
    
    // Admin
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@unternehmen.de',
        fullName: 'Administrator',
        passwordHash: '$2a$12$jNzbALnZcFwqfiZZalig5O8JfuIxtKFoF80B0c/JE/JRFdG762ffW', // Passwort: "test"
        role: 'admin',
        marketId: eCenter.id,
        department: 'Geschäftsführung',
        isActive: true
      }
    })

    // Susanne Asel (E-Center, Markt)
    const susanne = await prisma.user.create({
      data: {
        username: 'susanne.asel',
        email: 'susanne.asel@ecenter.de',
        fullName: 'Susanne Asel',
        passwordHash: '$2a$12$jNzbALnZcFwqfiZZalig5O8JfuIxtKFoF80B0c/JE/JRFdG762ffW', // Passwort: "test"
        role: 'employee',
        marketId: eCenter.id,
        department: 'Markt',
        isActive: true
      }
    })

    // Max Müller (E-Center, Bäckerei)
    const max = await prisma.user.create({
      data: {
        username: 'max.mueller',
        email: 'max.mueller@ecenter.de',
        fullName: 'Max Müller',
        passwordHash: '$2a$12$jNzbALnZcFwqfiZZalig5O8JfuIxtKFoF80B0c/JE/JRFdG762ffW', // Passwort: "test"
        role: 'employee',
        marketId: eCenter.id,
        department: 'Bäckerei',
        isActive: true
      }
    })

    // Anna Schmidt (E-Center, Kasse)
    const anna = await prisma.user.create({
      data: {
        username: 'anna.schmidt',
        email: 'anna.schmidt@ecenter.de',
        fullName: 'Anna Schmidt',
        passwordHash: '$2a$12$jNzbALnZcFwqfiZZalig5O8JfuIxtKFoF80B0c/JE/JRFdG762ffW', // Passwort: "test"
        role: 'employee',
        marketId: eCenter.id,
        department: 'Kasse',
        isActive: true
      }
    })

    // Peter Wagner (Edeka, Metzgerei)
    const peter = await prisma.user.create({
      data: {
        username: 'peter.wagner',
        email: 'peter.wagner@edeka.de',
        fullName: 'Peter Wagner',
        passwordHash: '$2a$12$jNzbALnZcFwqfiZZalig5O8JfuIxtKFoF80B0c/JE/JRFdG762ffW', // Passwort: "test"
        role: 'employee',
        marketId: edeka.id,
        department: 'Metzgerei',
        isActive: true
      }
    })

    // Lisa Klein (Edeka, Markt)
    const lisa = await prisma.user.create({
      data: {
        username: 'lisa.klein',
        email: 'lisa.klein@edeka.de',
        fullName: 'Lisa Klein',
        passwordHash: '$2a$12$jNzbALnZcFwqfiZZalig5O8JfuIxtKFoF80B0c/JE/JRFdG762ffW', // Passwort: "test"
        role: 'employee',
        marketId: edeka.id,
        department: 'Markt',
        isActive: true
      }
    })

    console.log(`✅ ${[admin, susanne, max, anna, peter, lisa].length} Demo-Benutzer erstellt`)

    // 3. Demo-Urlaubsanträge erstellen
    console.log('\n🏖️ Erstelle Demo-Urlaubsanträge...')
    
    const urlaubsantraege = [
      // Susanne Asel - Januar 2026
      {
        userId: susanne.id,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-13'),
        status: VacationStatus.offen,
        description: 'Winterurlaub'
      },
      // Max Müller - Februar 2026
      {
        userId: max.id,
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-17'),
        status: VacationStatus.genehmigt,
        description: 'Skiurlaub'
      },
      // Anna Schmidt - März 2026
      {
        userId: anna.id,
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-22'),
        status: VacationStatus.offen,
        description: 'Frühlingsurlaub'
      },
      // Peter Wagner - Juli 2026
      {
        userId: peter.id,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-14'),
        status: VacationStatus.offen,
        description: 'Sommerurlaub'
      },
      // Lisa Klein - August 2026
      {
        userId: lisa.id,
        startDate: new Date('2026-08-10'),
        endDate: new Date('2026-08-24'),
        status: VacationStatus.genehmigt,
        description: 'Sommerferien'
      },
      // Susanne Asel - Oktober 2026 (zweiter Urlaub)
      {
        userId: susanne.id,
        startDate: new Date('2026-10-05'),
        endDate: new Date('2026-10-12'),
        status: VacationStatus.offen,
        description: 'Herbstferien'
      }
    ]

    for (const urlaub of urlaubsantraege) {
      await prisma.vacation.create({ data: urlaub })
    }

    console.log(`✅ ${urlaubsantraege.length} Demo-Urlaubsanträge erstellt`)

    // 4. Statistiken anzeigen
    console.log('\n📊 Demo-Datenbank-Statistiken:')
    const marketCount = await prisma.market.count()
    const userCount = await prisma.user.count()
    const vacationCount = await prisma.vacation.count()

    console.log(`   Märkte: ${marketCount}`)
    console.log(`   Benutzer: ${userCount}`)
    console.log(`   Urlaubsanträge: ${vacationCount}`)

    // 5. Login-Informationen anzeigen
    console.log('\n🔐 Demo-Login-Daten:')
    console.log('   Username: admin      | Passwort: test | Rolle: Administrator')
    console.log('   Username: susanne.asel | Passwort: test | Rolle: Mitarbeiter (E-Center, Markt)')
    console.log('   Username: max.mueller  | Passwort: test | Rolle: Mitarbeiter (E-Center, Bäckerei)')
    console.log('   Username: anna.schmidt | Passwort: test | Rolle: Mitarbeiter (E-Center, Kasse)')
    console.log('   Username: peter.wagner | Passwort: test | Rolle: Mitarbeiter (Edeka, Metzgerei)')
    console.log('   Username: lisa.klein   | Passwort: test | Rolle: Mitarbeiter (Edeka, Markt)')

    console.log('\n🎉 Demo-Daten erfolgreich erstellt!')
    console.log('💡 Die Prüfungsansicht kann jetzt getestet werden!')
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Demo-Daten:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('💥 Unerwarteter Fehler:', error)
  process.exit(1)
})

#!/usr/bin/env tsx
/**
 * Einfaches Seeding der Datenbank mit Testdaten
 */

import { PrismaClient, VacationStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Datenbank...')
  
  try {
    // 1. Märkte erstellen
    const edeka = await prisma.market.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'E-Center',
        address: 'Musterstraße 1, 12345 Musterstadt',
        phone: '+49 123 456789',
        email: 'info@ecenter.de'
      }
    })

    const eCenter = await prisma.market.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Edeka',
        address: 'Beispielweg 15, 54321 Beispielstadt',
        phone: '+49 987 654321',
        email: 'info@edeka.de'
      }
    })

    console.log('✅ Märkte erstellt')

    // 2. Benutzer erstellen
    const admin = await prisma.user.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        username: 'admin',
        email: 'admin@unternehmen.de',
        fullName: 'Unternehmer Admin',
        passwordHash: '$2a$12$Vvr4CtsWXG76RYtY4ka5uOfPipcxWHWKT12JOyW8nyxBZ4D4RW/oW',
        role: 'admin',
        marketId: 2,
        department: 'Geschäftsführung',
        isActive: true
      }
    })

    const susanne = await prisma.user.upsert({
      where: { id: 7 },
      update: {},
      create: {
        id: 7,
        username: 'susanne.asel',
        email: 'susanne.asel@ecenter.de',
        fullName: 'Susanne Asel',
        passwordHash: '$2a$12$jNzbALnZcFwqfiZZalig5O8JfuIxtKFoF80B0c/JE/JRFdG762ffW',
        role: 'employee',
        marketId: 2,
        department: 'Markt',
        isActive: true
      }
    })

    const testUser = await prisma.user.upsert({
      where: { id: 8 },
      update: {},
      create: {
        id: 8,
        username: 'test.user',
        email: 'test.user@ecenter.de',
        fullName: 'Test User',
        passwordHash: '$2a$12$T.lwsDpdW1pkLFahJ43WLe4J6OWzw2Ry9VSVOn3wf8Ka3qf1WDufe',
        role: 'employee',
        marketId: 2,
        department: 'Markt',
        isActive: true
      }
    })

    console.log('✅ Benutzer erstellt')

    // 3. Urlaubsanträge erstellen
    const vacation1 = await prisma.vacation.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        userId: 7,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-13'),
        status: VacationStatus.offen,
        description: ''
      }
    })

    const vacation2 = await prisma.vacation.upsert({
      where: { id: 10 },
      update: {},
      create: {
        id: 10,
        userId: 8,
        startDate: new Date('2026-02-02'),
        endDate: new Date('2026-02-14'),
        status: VacationStatus.offen,
        description: ''
      }
    })

    console.log('✅ Urlaubsanträge erstellt')

    // Statistiken anzeigen
    const marketCount = await prisma.market.count()
    const userCount = await prisma.user.count()
    const vacationCount = await prisma.vacation.count()

    console.log(`📊 Datenbank-Inhalt:`)
    console.log(`   Märkte: ${marketCount}`)
    console.log(`   Benutzer: ${userCount}`)
    console.log(`   Urlaubsanträge: ${vacationCount}`)

    console.log('\n🎉 Seeding erfolgreich!')
    
  } catch (error) {
    console.error('❌ Seeding fehlgeschlagen:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

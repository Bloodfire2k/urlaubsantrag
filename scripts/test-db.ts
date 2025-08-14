#!/usr/bin/env tsx
/**
 * Einfacher Datenbanktest
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔗 Teste Datenbankverbindung...')
  
  try {
    await prisma.$connect()
    console.log('✅ Datenbankverbindung erfolgreich')
    
    // Teste einfache Abfrage
    const marketCount = await prisma.market.count()
    console.log(`📊 Aktuelle Märkte in DB: ${marketCount}`)
    
  } catch (error) {
    console.error('❌ Datenbankfehler:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

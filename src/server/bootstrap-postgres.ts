// src/server/bootstrap-postgres.ts
import { execSync } from 'node:child_process'
import { prisma } from '../lib/prisma'
import * as bcrypt from 'bcryptjs'

async function waitForDb(maxTries = 20, delayMs = 1500) {
  for (let i = 1; i <= maxTries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      return
    } catch {
      console.log(`[db] not ready, retry ${i}/${maxTries}…`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw new Error('DB not reachable after retries')
}

function run(cmd: string) {
  console.log('[prisma]', cmd)
  execSync(cmd, { stdio: 'inherit' })
}

export async function migrateAndSeedPostgres() {
  await waitForDb()

  // Migrations → Fallback db push
  try {
    run('npx prisma migrate deploy')
  } catch {
    console.log('[prisma] no migrations found → running db push')
    run('npx prisma db push')
  }

  // Feste Märkte anlegen (Edeka, E-Center)
  let edekaMarket = await prisma.market.findFirst({ where: { name: 'Edeka' } })
  if (!edekaMarket) {
    edekaMarket = await prisma.market.create({
      data: {
        name: 'Edeka',
        address: 'Musterstraße 1, 12345 Musterstadt',
        phone: '+49 123 456789',
        email: 'info@edeka-musterstadt.de',
      },
    })
    console.log('[seed] Edeka-Markt angelegt')
  }

  let ecenterMarket = await prisma.market.findFirst({ where: { name: 'E-Center' } })
  if (!ecenterMarket) {
    ecenterMarket = await prisma.market.create({
      data: {
        name: 'E-Center',
        address: 'Beispielstraße 42, 54321 Beispielstadt',
        phone: '+49 987 654321',
        email: 'info@ecenter-beispielstadt.de',
      },
    })
    console.log('[seed] E-Center-Markt angelegt')
  }

  // Standard-Markt für Admin (E-Center oder erster verfügbarer)
  const defaultMarket = ecenterMarket || edekaMarket || await prisma.market.findFirst()
  if (!defaultMarket) {
    throw new Error('Kein Markt verfügbar für Admin-Seed')
  }

  // Admin-User sicherstellen
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const admin = await prisma.user.findFirst({ where: { username: adminUsername } })
  if (!admin) {
    const adminPwd = process.env.ADMIN_PASSWORD || 'admin123'
    const passwordHash = await bcrypt.hash(adminPwd, 10)
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: process.env.ADMIN_EMAIL || 'admin@ecenter-jochum.de',
        fullName: 'Administrator',
        department: 'Zentrale',
        role: 'admin',
        passwordHash,
        market: { connect: { id: defaultMarket.id } }, // required relation!
      },
    })
    console.log(`[seed] admin user angelegt: ${adminUsername} / ${adminPwd}`)
  } else {
    console.log('[seed] admin existiert bereits, überspringe')
  }
}

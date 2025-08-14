/**
 * Prisma Client Singleton
 * 
 * Stellt sicher, dass nur eine Instanz des Prisma Clients existiert
 * und wiederverwendet wird (wichtig für Development Hot-Reload)
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // Verhindere mehrere Instanzen bei Hot-Reload in Development
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

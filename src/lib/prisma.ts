/**
 * Prisma Client Singleton
 * 
 * Stellt sicher, dass nur eine Instanz des Prisma Clients existiert
 * und wiederverwendet wird (wichtig für Development Hot-Reload)
 */

import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = g.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? [] : ['error','warn'],
});

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;

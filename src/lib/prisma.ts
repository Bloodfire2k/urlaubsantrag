/**
 * Prisma Client Singleton
 * 
 * Stellt sicher, dass nur eine Instanz des Prisma Clients existiert
 * und wiederverwendet wird (wichtig für Development Hot-Reload)
 */

import { PrismaClient } from '@prisma/client';

function normalizedDbUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  // Prisma erwartet "postgresql://"
  if (raw.startsWith('postgres://')) {
    return 'postgresql://' + raw.slice('postgres://'.length);
  }
  return raw;
}

const url = normalizedDbUrl();
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  g.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['error', 'warn'],
    ...(url ? { datasources: { db: { url } } } : {}), // nutzt korrigierte URL
  });

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;

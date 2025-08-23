// src/server/data/usersRepo.ts
import { prisma } from '../../lib/prisma'
import { verifyPassword } from '../utils/password'
type UserEntity = import('@prisma/client').User

export type UsersRepo = {
  findByUsername(username: string): Promise<UserEntity | null>
  findByUsernameOrEmail(idf: string): Promise<UserEntity | null>
  count(): Promise<number>
  create(data: {
    username: string; email: string; fullName: string; department: string;
    role: 'admin' | 'manager' | 'employee'; passwordHash: string; marketId: number
  }): Promise<UserEntity>
  verify(plain: string, hash: string): Promise<boolean>
}

function pgRepo(): UsersRepo {
  return {
    findByUsername: (username) => prisma.user.findFirst({ where: { username } }),
    findByUsernameOrEmail: (idf) => prisma.user.findFirst({
      where: { OR: [{ username: idf.toLowerCase() }, { email: idf.toLowerCase() }] }
    }),
    count: () => prisma.user.count(),
    create: (data) => prisma.user.create({ data }),
    verify: async (plain, hash) => {
      return verifyPassword(plain, hash)
    }
  }
}

// Optional: JSON-Repo belassen wie bisher, aber ohne Top-Level-await
function jsonRepo(): UsersRepo {
  // Rufe hier die vorhandenen JSON-Funktionen auf (falls genutzt)
  // oder wirf einen Fehler, wenn JSON im Prod nicht mehr verwendet werden soll.
  return {
    async findByUsername() { return null },
    async findByUsernameOrEmail() { return null },
    async count() { return 0 },
    async create() { throw new Error('JSON repo not supported in postgres mode') },
    async verify() { return false }
  }
}

export function getUsersRepo(): UsersRepo {
  return process.env.DB_TYPE === 'postgres' ? pgRepo() : jsonRepo()
  // keine async Initialisierung!
}

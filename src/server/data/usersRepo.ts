// src/server/data/usersRepo.ts
import { password } from '../utils/password';

const usePg =
  process.env.NODE_ENV === 'production' &&
  (process.env.DB_TYPE || '').toLowerCase() === 'postgres';

export type SimpleUser = {
  id: any;
  username: string;
  email?: string | null;
  role: string;
  passwordHash: string;
};

// WICHTIG: Keine top-level awaits! Alles erst IN den Funktionen importieren.
export const usersRepo = {
  async count(): Promise<number> {
    if (usePg) {
      const { prisma } = await import('../../lib/prisma');
      return prisma.user.count();
    } else {
      const { db } = await import('../database');
      return db.users.length;
    }
  },

  async findByUsernameOrEmail(idf: string): Promise<SimpleUser | null> {
    const x = idf.toLowerCase();
    if (usePg) {
      const { prisma } = await import('../../lib/prisma');
      return (await prisma.user.findFirst({
        where: { OR: [{ username: x }, { email: x }] },
      })) as unknown as SimpleUser | null;
    } else {
      const { db } = await import('../database');
      const u = db.users;
      return (u.find(
        (r: any) =>
          r.username?.toLowerCase() === x || r.email?.toLowerCase() === x
      ) ?? null) as SimpleUser | null;
    }
  },

  async createAdmin(username: string, email: string, plain: string) {
    const hash = await password.hash(plain, 10);
    if (usePg) {
      const { prisma } = await import('../../lib/prisma');
      return prisma.user.create({
        data: { username, email, passwordHash: hash, role: 'admin' },
      });
    } else {
      const { db } = await import('../database');
      return db.addUser({ 
        username, 
        email, 
        fullName: username, 
        password_hash: hash, 
        role: 'admin', 
        market_id: 1, 
        is_active: true 
      });
    }
  },

  async verify(plain: string, hash: string) {
    return password.compare(plain, hash);
  },
};

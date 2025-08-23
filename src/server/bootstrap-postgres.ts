import { execSync } from 'node:child_process';
import { prisma } from '../lib/prisma';
import { password } from './utils/password';

export async function migrateAndSeedPostgres() {
  if (process.env.NODE_ENV !== 'production') return;
  if ((process.env.DB_TYPE||'').toLowerCase()!=='postgres') return;
  execSync('npx prisma migrate deploy', { stdio:'inherit' });
  console.log('✅ prisma migrate deploy done');
  const c = await prisma.user.count().catch(()=>0);
  if (c === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email    = process.env.ADMIN_EMAIL    || 'admin@example.com';
    const plain    = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await password.hash(plain, 10);
    await prisma.user.create({ data:{ username, email, passwordHash: hash, role:'admin' }});
    console.log('🌱 Seeded admin user:', username);
  } else {
    console.log('ℹ️ Users already present, skip admin seed');
  }
}

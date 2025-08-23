import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const prisma = new PrismaClient();
const { Client } = pg;

async function waitForDb(url: string, timeoutMs = 60000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeoutMs) {
    attempt++;
    try {
      const c = new Client({ connectionString: url });
      await c.connect();
      await c.end();
      return;
    } catch {
      const wait = Math.min(2000 + attempt * 200, 5000);
      console.log(`[db] not ready, retry #${attempt} in ${wait}ms…`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw new Error('DB not reachable after retries');
}

async function tableExists(url: string, fqName: string) {
  const c = new Client({ connectionString: url });
  await c.connect();
  const res = await c.query('select to_regclass($1) as found', [fqName]);
  await c.end();
  return Boolean(res.rows?.[0]?.found);
}

function run(cmd: string) { 
  console.log(`[prisma] ${cmd}`); 
  execSync(cmd, { stdio: 'inherit' }); 
}

function hasMigrationsDir(): boolean {
  const fs = require('fs'); 
  const base = 'prisma/migrations';
  try { 
    if (!fs.existsSync(base)) return false; 
    return fs.readdirSync(base).filter((d:string)=>!d.startsWith('.')).length>0; 
  } catch { 
    return false; 
  }
}

async function ensureUsersTable(url: string) {
  if (!(await tableExists(url, 'public.users'))) {
    console.warn('[prisma] users table missing → running `prisma db push` fallback');
    run('npx prisma db push');
  }
}

async function hashPassword(plain: string): Promise<string> {
  try {
    const bcrypt = await import('bcrypt');
    return await bcrypt.hash(plain, 10);
  } catch {
    console.log('[auth] using bcryptjs (fallback)');
    const mod = await import('bcryptjs');
    const bjs: any = (mod as any).default || mod;
    return await bjs.hash(plain, 10);
  }
}

export async function migrateAndSeedPostgres() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  
  // Nur in Production mit Postgres ausführen
  if (process.env.NODE_ENV !== 'production' || process.env.DB_TYPE !== 'postgres') {
    console.log('[bootstrap] Skipping Postgres bootstrap - not in production with postgres');
    return;
  }

  await waitForDb(url);

  // Erst migrations, sichtbar im Log
  if (hasMigrationsDir()) { 
    try { 
      run('npx prisma migrate deploy'); 
    } catch { 
      console.warn('[prisma] migrate deploy failed → fallback db push'); 
      run('npx prisma db push'); 
    } 
  } else { 
    console.warn('[prisma] no migrations found → running db push'); 
    run('npx prisma db push'); 
  }

  // Verifizieren / ggf. fallback
  await ensureUsersTable(url);

  // Seed nur wenn Tabelle leer
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      const username = process.env.ADMIN_USERNAME ?? 'admin';
      const email    = process.env.ADMIN_EMAIL ?? 'admin@example.com';
      const password = process.env.ADMIN_PASSWORD ?? 'admin123';
      const passwordHash = await hashPassword(password);
      const fullName = process.env.ADMIN_FULLNAME ?? 'Administrator';
      await prisma.user.create({
        data: { username, email, passwordHash, role: 'admin' as any, fullName }
      });
      console.log(`🌱 Seeded admin user: ${username}`);
    }
  } catch (e) {
    console.warn('[seed] could not count/seed users, trying fallback ensure again', e);
    await ensureUsersTable(url);
    const cnt2 = await prisma.user.count();
    if (cnt2 === 0) {
      const username = process.env.ADMIN_USERNAME ?? 'admin';
      const email    = process.env.ADMIN_EMAIL ?? 'admin@example.com';
      const password = process.env.ADMIN_PASSWORD ?? 'admin123';
      const passwordHash = await hashPassword(password);
      const fullName = process.env.ADMIN_FULLNAME ?? 'Administrator';
      await prisma.user.create({
        data: { username, email, passwordHash, role: 'admin' as any, fullName }
      });
      console.log(`🌱 Seeded admin user: ${username}`);
    }
  }
}

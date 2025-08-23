import { password } from '../utils/password';

const usePg = process.env.NODE_ENV === 'production' && (process.env.DB_TYPE||'').toLowerCase()==='postgres';

export type SimpleUser = { id:any; username:string; email?:string|null; role:string; passwordHash:string };

export const usersRepo = usePg ? await (async () => {
  const { prisma } = await import('../../lib/prisma');
  return {
    async count(){ return prisma.user.count(); },
    async findByUsernameOrEmail(idf:string){
      const x = idf.toLowerCase();
      return prisma.user.findFirst({
        where:{ OR:[{ username: x }, { email: x }] }
      }) as unknown as Promise<SimpleUser|null>;
    },
    async createAdmin(username:string, email:string, plain:string){
      const hash = await password.hash(plain, 10);
      return prisma.user.create({ data:{ username, email, passwordHash: hash, role:'admin' }});
    },
    async verify(plain:string, hash:string){ return password.compare(plain, hash); },
  };
})() : await (async () => {
  // JSON-DB Adapter – benutze die bestehende JSON-DB APIs aus dem Projekt
  const { db } = await import('../database');
  return {
    async count(){ return db.users.length; },
    async findByUsernameOrEmail(idf:string){
      const x = idf.toLowerCase(); 
      return db.users.find((r:any)=>r.username?.toLowerCase()===x || r.email?.toLowerCase()===x) ?? null;
    },
    async createAdmin(username:string, email:string, plain:string){
      const hash = await password.hash(plain, 10);
      return db.addUser({ username, email, fullName: username, password_hash: hash, role:'admin', market_id: 1, is_active: true });
    },
    async verify(plain:string, hash:string){ return password.compare(plain, hash); },
  };
})();

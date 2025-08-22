let impl: { hash: (p: string, r?: number) => Promise<string>; compare: (p: string, h: string) => Promise<boolean> };

try {
  const bcrypt = require('bcrypt');
  impl = { 
    hash: (p: string, r: number = 10) => bcrypt.hash(p, r), 
    compare: (p: string, h: string) => bcrypt.compare(p, h) 
  };
  console.log('[auth] using bcrypt (native)');
} catch {
  const bcryptjs = require('bcryptjs');
  impl = {
    hash: (p: string, r: number = 10) => new Promise((res, rej) => 
      bcryptjs.genSalt(r, (e: any, s: string) => e ? rej(e) : bcryptjs.hash(p, s, (e2: any, h: string) => e2 ? rej(e2) : res(h)))
    ),
    compare: (p: string, h: string) => new Promise(res => 
      bcryptjs.compare(p, h, (_e: any, same: boolean) => res(!!same))
    ),
  };
  console.log('[auth] using bcryptjs (fallback)');
}

export const password = impl;

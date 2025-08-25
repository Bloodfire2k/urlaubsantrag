import { httpGetJson } from './http';

export type UsersResult = { items: any[]; total: number };

function normalize(u:any){ 
  return {
    ...u,
    marketId:  u.marketId  ?? u.market_id,
    isActive:  u.isActive  ?? u.is_active,
    createdAt: u.createdAt ?? u.created_at,
  };
}

export async function fetchUsersList(prev?: any[]): Promise<UsersResult> {
  const payload = await httpGetJson('/api/users', { prev });
  if (!payload) return { items: prev ?? [], total: prev?.length ?? 0 };
  const items = Array.isArray(payload) ? payload : (payload.items ?? []);
  const total = !Array.isArray(payload) && typeof payload.total === 'number' ? payload.total : items.length;
  return { items: items.map(normalize), total };
}

import { apiFetch } from './api'

export interface UsersResponse {
  items: any[]
  total: number
}

export const fetchUsersList = async (prevUsers?: any[]): Promise<UsersResponse> => {
  const response = await fetch(`/api/users?t=${Date.now()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  // Bei 304-Response bestehenden Zustand beibehalten
  if (response.status === 304) {
    return { 
      items: prevUsers ?? [], 
      total: (prevUsers?.length ?? 0) 
    }
  }

  // JSON laden und tolerant parsen
  const data = await response.json()
  
  let items: any[] = []
  let total: number = 0

  // Falls Response ein Array ist → als items behandeln
  if (Array.isArray(data)) {
    items = data
    total = data.length
  } else {
    // Falls Response ein Objekt ist → items = payload.items ?? [], total = payload.total ?? items.length
    items = data.items ?? data.users ?? []
    total = data.total ?? items.length
  }

  // Mapping je Item: market_id→marketId, is_active→isActive, created_at→createdAt
  // Originalwerte erhalten, aber camelCase priorisieren
  const norm = (u: any) => ({
    ...u,
    marketId: u.marketId ?? u.market_id,
    isActive: u.isActive ?? u.is_active,
    createdAt: u.createdAt ?? u.created_at,
  })

  return { 
    items: items.map(norm), 
    total 
  }
}

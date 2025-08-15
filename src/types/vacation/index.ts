export interface Market {
  id: number
  name: string
  location: string
}

export interface User {
  id: number
  username: string
  fullName: string
  market_id: number
  department: string
  is_active: boolean
}

export interface Urlaub {
  id: string
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export const DEPARTMENTS = ['Markt', 'Bäckerei', 'Metzgerei', 'Kasse'] as const

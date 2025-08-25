export interface Market {
  id: number
  name: string
  location: string
}

export interface User {
  id: number
  username: string
  fullName: string
  marketId: number
  department: string
  isActive: boolean
}

export interface Urlaub {
  id: string
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  status: 'offen' | 'genehmigt' | 'abgelehnt'
  createdAt: string
  mitarbeiter?: {
    id: number
    fullName: string
    department: string
    marketId: number
    market: {
      id: number
      name: string
    }
  }
}

export const DEPARTMENTS = ['Markt', 'Bäckerei', 'Metzgerei', 'Kasse'] as const

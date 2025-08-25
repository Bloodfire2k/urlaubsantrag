export interface Urlaub {
  id: string
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  status: 'offen' | 'genehmigt' | 'abgelehnt'
  createdAt: string
  genehmigtVon?: string
  genehmigtAm?: string
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

export interface UrlaubBudget {
  mitarbeiterId: number
  mitarbeiterName: string
  jahr: number
  jahresanspruch: number
  genommen: number
  verplant: number
  uebertrag: number
}

export interface MitarbeiterStats {
  id: number
  name: string
  zuVerplanen: number
  verplant: number
  offen: number
  jahresanspruch: number
}

export interface GlobalStats {
  zuVerplanen: number
  verplant: number
  offen: number
}

export type UrlaubStatus = 'eingetragen' | 'teilweise' | 'nicht-eingetragen'

export interface StatusCounts {
  eingetragen: number
  teilweise: number
  nichtEingetragen: number
}

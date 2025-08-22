export interface Urlaub {
  id: string
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  genehmigtVon?: string
  genehmigtAm?: string
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

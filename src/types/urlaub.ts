// Backend-kompatible Typen (mit number IDs)
export interface UrlaubBackend {
  id: number
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  bemerkung?: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface UrlaubBudgetBackend {
  id: number
  mitarbeiterId: number
  jahr: number
  jahresanspruch: number // Gesamturlaubstage pro Jahr
  genommen: number // Bereits genommene Urlaubstage
  verplant: number // Bereits beantragte aber noch nicht genommene Tage
  verbleibend: number // Noch verfügbare Urlaubstage
  uebertrag: number // Übertragene Tage vom Vorjahr
}

export interface UrlaubAntragBackend {
  id: number
  mitarbeiterId: number
  startDatum: string
  endDatum: string
  bemerkung?: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  genehmigtVon?: string
  genehmigtAm?: string
}

// Frontend-kompatible Typen (mit string IDs für Kompatibilität)
export interface Urlaub {
  id: string
  mitarbeiterId: string
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  bemerkung?: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface UrlaubBudget {
  mitarbeiterId: string
  jahr: number
  jahresanspruch: number // Gesamturlaubstage pro Jahr
  genommen: number // Bereits genommene Urlaubstage
  verplant: number // Bereits beantragte aber noch nicht genommene Tage
  verbleibend: number // Noch verfügbare Urlaubstage
  uebertrag: number // Übertragene Tage vom Vorjahr
}

export interface UrlaubAntrag {
  id: string
  mitarbeiterId: string
  startDatum: string
  endDatum: string
  bemerkung?: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  genehmigtVon?: string
  genehmigtAm?: string
}

// Hilfsfunktionen für Typ-Konvertierung
export const convertUrlaubFromBackend = (urlaub: UrlaubBackend): Urlaub => ({
  id: urlaub.id.toString(),
  mitarbeiterId: urlaub.mitarbeiterId.toString(),
  mitarbeiterName: urlaub.mitarbeiterName,
  startDatum: urlaub.startDatum,
  endDatum: urlaub.endDatum,
  bemerkung: urlaub.bemerkung,
  createdAt: urlaub.createdAt,
  status: urlaub.status
})

export const convertUrlaubBudgetFromBackend = (budget: UrlaubBudgetBackend): UrlaubBudget => ({
  mitarbeiterId: budget.mitarbeiterId.toString(),
  jahr: budget.jahr,
  jahresanspruch: budget.jahresanspruch,
  genommen: budget.genommen,
  verplant: budget.verplant,
  verbleibend: budget.verbleibend,
  uebertrag: budget.uebertrag
})

export const convertUrlaubAntragFromBackend = (antrag: UrlaubAntragBackend): UrlaubAntrag => ({
  id: antrag.id.toString(),
  mitarbeiterId: antrag.mitarbeiterId.toString(),
  startDatum: antrag.startDatum,
  endDatum: antrag.endDatum,
  bemerkung: antrag.bemerkung,
  createdAt: antrag.createdAt,
  status: antrag.status,
  genehmigtVon: antrag.genehmigtVon,
  genehmigtAm: antrag.genehmigtAm
})

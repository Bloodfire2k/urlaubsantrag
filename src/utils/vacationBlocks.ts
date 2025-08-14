import { addDays } from 'date-fns'

// Funktion zur Berechnung des Osterdatums (Gauß-Algorithmus)
function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

// Interface für gesperrte Zeiträume
export interface BlockedPeriod {
  start: Date
  end: Date
  reason: string
}

// Gesperrte Zeiträume für ein Jahr berechnen
export function getBlockedPeriods(year: number): BlockedPeriod[] {
  const periods: BlockedPeriod[] = []
  
  // 1. Osterwoche (Montag vor Karfreitag bis Sonntag nach Ostern)
  const easterSunday = getEasterSunday(year)
  const goodFriday = addDays(easterSunday, -2) // Karfreitag
  const mondayBeforeGoodFriday = addDays(goodFriday, -4) // Montag der Osterwoche
  
  periods.push({
    start: mondayBeforeGoodFriday,
    end: easterSunday,
    reason: 'Osterwoche - Urlaubssperre'
  })
  
  // 2. Gesamter Dezember
  const decemberStart = new Date(year, 11, 1) // 1. Dezember
  const decemberEnd = new Date(year, 11, 31)  // 31. Dezember
  
  periods.push({
    start: decemberStart,
    end: decemberEnd,
    reason: 'Dezember - Urlaubssperre'
  })
  
  return periods
}

// Prüfen ob ein Zeitraum mit gesperrten Zeiten kollidiert
export function isDateRangeBlocked(startDate: Date, endDate: Date, year: number): { blocked: boolean; reason?: string; blockedPeriod?: BlockedPeriod } {
  const blockedPeriods = getBlockedPeriods(year)
  
  for (const period of blockedPeriods) {
    // Überlappung prüfen
    if (startDate <= period.end && endDate >= period.start) {
      return {
        blocked: true,
        reason: period.reason,
        blockedPeriod: period
      }
    }
  }
  
  return { blocked: false }
}

// Formatierte Liste der gesperrten Zeiträume für Anzeige
export function getBlockedPeriodsForDisplay(year: number): string[] {
  const periods = getBlockedPeriods(year)
  return periods.map(period => {
    const startStr = period.start.toLocaleDateString('de-DE')
    const endStr = period.end.toLocaleDateString('de-DE')
    return `${startStr} - ${endStr}: ${period.reason}`
  })
}

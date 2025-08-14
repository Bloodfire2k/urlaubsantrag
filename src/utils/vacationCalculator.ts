// Urlaubstage-Berechnung mit Ausschluss von Sonntagen und hessischen Feiertagen

/**
 * Berechnet die Anzahl der Arbeitstage zwischen zwei Daten
 * Ausgeschlossen werden:
 * - Sonntage
 * - Feiertage in Hessen
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Sicherstellen, dass Start vor Ende liegt
  if (start > end) {
    return 0
  }
  
  let workingDays = 0
  const currentDate = new Date(start)
  
  // Jeden Tag zwischen Start und Ende prüfen
  while (currentDate <= end) {
    if (isWorkingDay(currentDate)) {
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return workingDays
}

/**
 * Prüft ob ein Tag ein Arbeitstag ist (kein Sonntag, kein Feiertag)
 */
function isWorkingDay(date: Date): boolean {
  // Sonntag ausschließen (0 = Sonntag)
  if (date.getDay() === 0) {
    return false
  }
  
  // Feiertage ausschließen
  if (isHessianHoliday(date)) {
    return false
  }
  
  return true
}

/**
 * Prüft ob ein Datum ein hessischer Feiertag ist
 */
function isHessianHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const holidays = getHessianHolidays(year)
  
  const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD Format
  return holidays.includes(dateString)
}

/**
 * Gibt alle hessischen Feiertage für ein Jahr zurück
 */
function getHessianHolidays(year: number): string[] {
  const holidays: string[] = []
  
  // Feste Feiertage
  holidays.push(`${year}-01-01`) // Neujahr
  holidays.push(`${year}-05-01`) // Tag der Arbeit
  holidays.push(`${year}-10-03`) // Tag der Deutschen Einheit
  holidays.push(`${year}-12-25`) // 1. Weihnachtsfeiertag
  holidays.push(`${year}-12-26`) // 2. Weihnachtsfeiertag
  
  // Bewegliche Feiertage (abhängig von Ostern)
  const easter = getEasterDate(year)
  
  // Karfreitag (2 Tage vor Ostern)
  const goodFriday = new Date(easter)
  goodFriday.setDate(goodFriday.getDate() - 2)
  holidays.push(goodFriday.toISOString().split('T')[0])
  
  // Ostermontag (1 Tag nach Ostern)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easterMonday.getDate() + 1)
  holidays.push(easterMonday.toISOString().split('T')[0])
  
  // Christi Himmelfahrt (39 Tage nach Ostern)
  const ascensionDay = new Date(easter)
  ascensionDay.setDate(ascensionDay.getDate() + 39)
  holidays.push(ascensionDay.toISOString().split('T')[0])
  
  // Pfingstmontag (50 Tage nach Ostern)
  const whitMonday = new Date(easter)
  whitMonday.setDate(whitMonday.getDate() + 50)
  holidays.push(whitMonday.toISOString().split('T')[0])
  
  // Fronleichnam (60 Tage nach Ostern) - nur in Hessen in bestimmten Gebieten
  // Wir nehmen es mit auf, da es ein wichtiger katholischer Feiertag ist
  const corpusChristi = new Date(easter)
  corpusChristi.setDate(corpusChristi.getDate() + 60)
  holidays.push(corpusChristi.toISOString().split('T')[0])
  
  return holidays
}

/**
 * Berechnet das Osterdatum für ein gegebenes Jahr
 * Verwendet den Algorithmus von Gauß
 */
function getEasterDate(year: number): Date {
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
  
  return new Date(year, month - 1, day) // month - 1 da JavaScript Monate von 0-11 zählt
}

/**
 * Hilfsfunktion für das Frontend - formatiert die Anzahl der Arbeitstage
 */
export function formatWorkingDays(days: number): string {
  if (days === 1) {
    return '1 Arbeitstag'
  }
  return `${days} Arbeitstage`
}

import { db } from '../../database'
import { isDateRangeBlocked } from '../../../utils/vacationBlocks'

export const validationService = {
  // Validiere Urlaubsantrag
  validateUrlaubAntrag(startDatum: string, endDatum: string, userId: number) {
    const errors = []

    // Datum-Validierung
    const startDate = new Date(startDatum)
    const endDate = new Date(endDatum)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      errors.push('Startdatum kann nicht in der Vergangenheit liegen')
    }

    if (endDate < startDate) {
      errors.push('Enddatum muss nach dem Startdatum liegen')
    }

    // Urlaubsbudget prüfen
    const currentYear = new Date().getFullYear()
    const budget = db.getUrlaubBudget(userId, currentYear)
    
    if (!budget) {
      errors.push('Kein Urlaubsbudget für das aktuelle Jahr gefunden')
    } else {
      // Berechne Urlaubstage
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const availableDays = budget.jahresanspruch - budget.genommen - budget.verplant

      if (daysDiff > availableDays) {
        errors.push(`Nicht genügend Urlaubstage verfügbar. Verfügbar: ${availableDays}, Beantragt: ${daysDiff}`)
      }
    }

    // Urlaubssperre prüfen
    const startYear = startDate.getFullYear()
    const blockCheck = isDateRangeBlocked(startDate, endDate, startYear)
    if (blockCheck.blocked) {
      errors.push(`Urlaubssperre: ${blockCheck.reason}. Urlaub in diesem Zeitraum ist nicht möglich.`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Validiere Budget-Update
  validateBudgetUpdate(jahresanspruch: number, uebertrag: number) {
    const errors = []

    if (jahresanspruch < 20 || jahresanspruch > 40) {
      errors.push('Jahresanspruch muss zwischen 20 und 40 Tagen liegen')
    }

    if (uebertrag < 0 || uebertrag > 10) {
      errors.push('Übertrag darf nicht negativ sein und maximal 10 Tage betragen')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

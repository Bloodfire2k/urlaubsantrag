import React, { useMemo } from 'react'
import { Calendar, Clock, Eye } from 'lucide-react'
import { UrlaubBudget, Urlaub } from '../types/urlaub'
import { calculateWorkingDays } from '../utils/vacationCalculator'

interface StatsProps {
  budget?: UrlaubBudget
  urlaube?: Urlaub[]
}

const Stats: React.FC<StatsProps> = ({ budget, urlaube = [] }) => {
  // Korrekte Berechnung der verplanten Urlaubstage (ohne Sonntage und Feiertage)
  // useMemo verhindert unnötige Neuberechnungen
  const verplanteTage = useMemo(() => {
    let tage = 0
    try {
      const pendingUrlaube = urlaube.filter(u => u.status === 'pending')
      tage = pendingUrlaube.reduce((total, urlaub) => {
        const start = new Date(urlaub.startDatum)
        const end = new Date(urlaub.endDatum)
        const workingDays = calculateWorkingDays(start, end)

        return total + workingDays
      }, 0)

    } catch (error) {
      console.error('Fehler bei Urlaubsberechnung:', error)
      tage = urlaube.filter(u => u.status === 'pending').length * 5 // Fallback
    }
    return tage
  }, [urlaube]) // Nur neu berechnen wenn sich urlaube ändern

  // Budget mit korrekten verplanten Tagen (überschreibt Backend-Werte)
  const tempBudget = budget ? {
    ...budget,
    verplant: verplanteTage  // Verwende die korrekt berechneten Arbeitstage
  } : {
    jahresanspruch: 36,
    genommen: 0,
    verplant: verplanteTage,
    uebertrag: 0
  }



  const verfügbar = tempBudget.jahresanspruch - tempBudget.genommen - tempBudget.verplant

  return (
    <div className="stats-modern">
      <div className="stat-card-modern">
        <div className="stat-figure text-white mb-4"><Calendar className="w-8 h-8" /></div>
        <div className="stat-number-modern">{tempBudget.jahresanspruch}</div>
        <div className="stat-label-modern">Urlaubsanspruch</div>
      </div>

      <div className="stat-card-modern">
        <div className="stat-figure text-white mb-4"><Clock className="w-8 h-8" /></div>
        <div className="stat-number-modern">{tempBudget.verplant}</div>
        <div className="stat-label-modern">Verplanter Urlaub</div>
      </div>

      <div className="stat-card-modern">
        <div className="stat-figure text-white mb-4"><Eye className="w-8 h-8" /></div>
        <div className="stat-number-modern">{verfügbar}</div>
        <div className="stat-label-modern">Verfügbarer Urlaub</div>
      </div>
    </div>
  )
}

export default Stats

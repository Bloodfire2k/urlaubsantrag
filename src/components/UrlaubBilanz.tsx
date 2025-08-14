import React from 'react'
import { Calendar, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { UrlaubBudget, Urlaub } from '../types/urlaub'
import { useYear } from '../contexts/YearContext'

interface UrlaubBilanzProps {
  budget?: UrlaubBudget
  urlaube: Urlaub[]
}

const UrlaubBilanz: React.FC<UrlaubBilanzProps> = ({ budget, urlaube }) => {
  const { selectedYear } = useYear()
  
  // Fallback-Werte wenn kein Budget vorhanden ist
  const defaultBudget: UrlaubBudget = {
    mitarbeiterId: '0',
    jahr: selectedYear,
    jahresanspruch: 25,
    genommen: 0,
    verplant: 0,
    verbleibend: 25,
    uebertrag: 0
  }

  const currentBudget = budget || defaultBudget

  const getProgressPercentage = () => {
    const total = currentBudget.jahresanspruch + currentBudget.uebertrag
    const used = currentBudget.genommen + currentBudget.verplant
    return Math.round((used / total) * 100)
  }

  const getStatusColor = () => {
    const percentage = getProgressPercentage()
    if (percentage >= 90) return '#ef4444' // Rot - fast aufgebraucht
    if (percentage >= 70) return '#f59e0b' // Orange - zur Hälfte aufgebraucht
    return '#10b981' // Grün - noch viel verfügbar
  }

  const getStatusIcon = () => {
    const percentage = getProgressPercentage()
    if (percentage >= 90) return <AlertCircle size={20} color="#ef4444" />
    if (percentage >= 70) return <Clock size={20} color="#f59e0b" />
    return <CheckCircle size={20} color="#10b981" />
  }

  if (!budget) {
    return (
      <div className="card-modern bg-base-100 shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Urlaubsbilanz</h2>
          <p className="text-base-content/70">Kein Urlaubsbudget für dieses Jahr konfiguriert</p>
          <div className="alert alert-warning mt-4">
            <span>Ihr Urlaubsbudget wurde noch nicht eingerichtet. Bitte wenden Sie sich an Ihren Vorgesetzten.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern bg-base-100 shadow-xl border border-base-300 rounded-2xl">
      <div className="card-body">
        <h2 className="card-title">Meine Urlaubsbilanz {currentBudget.jahr}</h2>
        <p className="text-base-content/70">Übersicht Ihrer Urlaubstage und Verfügbarkeit</p>

        {/* Fortschritt */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Urlaubsverbrauch: {getProgressPercentage()}%</span>
            {getStatusIcon()}
          </div>
          <div className="progress-modern">
            <div className="progress-modern-bar" style={{width: `${getProgressPercentage()}%`}}></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="stat border border-base-300 rounded-2xl">
            <div className="stat-figure text-primary"><Calendar className="w-5 h-5" /></div>
            <div className="stat-title">Jahresanspruch</div>
            <div className="stat-value text-primary">{currentBudget.jahresanspruch + currentBudget.uebertrag}</div>
            <div className="stat-desc">{currentBudget.jahresanspruch} + {currentBudget.uebertrag} Übertrag</div>
          </div>
          <div className="stat border border-base-300 rounded-2xl">
            <div className="stat-figure text-success"><CheckCircle className="w-5 h-5" /></div>
            <div className="stat-title">Genommen</div>
            <div className="stat-value text-success">{currentBudget.genommen}</div>
            <div className="stat-desc">Bereits verbraucht</div>
          </div>
          <div className="stat border border-base-300 rounded-2xl">
            <div className="stat-figure text-warning"><Clock className="w-5 h-5" /></div>
            <div className="stat-title">Verplant</div>
            <div className="stat-value text-warning">{currentBudget.verplant}</div>
            <div className="stat-desc">Beantragt</div>
          </div>
          <div className="stat border border-base-300 rounded-2xl">
            <div className="stat-figure text-secondary"><TrendingUp className="w-5 h-5" /></div>
            <div className="stat-title">Verfügbar</div>
            <div className="stat-value text-secondary">{currentBudget.verbleibend}</div>
            <div className="stat-desc">Noch zu beantragen</div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-6 border border-base-300 rounded-2xl p-4 bg-base-200/50">
          <h4 className="mb-3 font-semibold">Detaillierte Aufschlüsselung</h4>
          <div className="grid gap-2">
            <div className="flex justify-between py-2 border-b border-base-300">
              <span>Jahresurlaub {currentBudget.jahr}:</span>
              <span className="font-semibold">{currentBudget.jahresanspruch} Tage</span>
            </div>
            <div className="flex justify-between py-2 border-b border-base-300">
              <span>Übertrag vom Vorjahr:</span>
              <span className="font-semibold">{currentBudget.uebertrag} Tage</span>
            </div>
            <div className="flex justify-between py-2 border-b border-base-300">
              <span>Gesamt verfügbar:</span>
              <span className="font-semibold text-success">{currentBudget.jahresanspruch + currentBudget.uebertrag} Tage</span>
            </div>
            <div className="flex justify-between py-2 border-b border-base-300">
              <span>Bereits genommen:</span>
              <span className="font-semibold text-error">-{currentBudget.genommen} Tage</span>
            </div>
            <div className="flex justify-between py-2 border-b border-base-300">
              <span>Bereits verplant:</span>
              <span className="font-semibold text-warning">-{currentBudget.verplant} Tage</span>
            </div>
            <div className="flex justify-between py-3 mt-1 bg-base-100 rounded-xl px-3 border-t-2 border-base-content">
              <span className="font-semibold">Verbleibend:</span>
              <span className="font-bold text-success text-lg">{currentBudget.verbleibend} Tage</span>
            </div>
          </div>
        </div>

        {currentBudget.verbleibend <= 5 && (
          <div className="alert alert-warning mt-4">
            <AlertCircle className="w-4 h-4" />
            <span>Nur noch {currentBudget.verbleibend} Urlaubstage verfügbar. Bitte sorgfältig planen.</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default UrlaubBilanz

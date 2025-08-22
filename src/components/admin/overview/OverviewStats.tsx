import React from 'react'
import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { GlobalStats, UrlaubBudget, MitarbeiterStats } from '../../../types/admin/overview'

interface OverviewStatsProps {
  globalStats: GlobalStats
  budgets: UrlaubBudget[]
  mitarbeiterStats: MitarbeiterStats[]
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({
  globalStats,
  budgets,
  mitarbeiterStats
}) => {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      <div className="stat-card-modern">
        <div className="stat-figure text-white mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="stat-number-modern">
          {budgets.reduce((sum, b) => sum + b.jahresanspruch, 0)}
        </div>
        <div className="stat-label-modern">Urlaubsanspruch</div>
      </div>

      <div className="stat-card-modern">
        <div className="stat-figure text-white mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <div className="stat-number-modern">{globalStats.verplant}</div>
        <div className="stat-label-modern">Verplanter Urlaub</div>
      </div>

      <div className="stat-card-modern">
        <div className="stat-figure text-white mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="stat-number-modern">{globalStats.zuVerplanen}</div>
        <div className="stat-label-modern">Verfügbarer Urlaub</div>
      </div>


    </div>
  )
}

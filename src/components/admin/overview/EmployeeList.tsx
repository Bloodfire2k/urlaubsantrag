import React from 'react'
import { User, ChevronRight, ShieldCheck, AlertTriangle, Ban } from 'lucide-react'
import { MitarbeiterStats, UrlaubBudget } from '../../../types/admin/overview'

interface EmployeeListProps {
  filteredStats: MitarbeiterStats[]
  statusFilter: string | null
  getUrlaubsStatus: (mitarbeiterId: number) => 'eingetragen' | 'teilweise' | 'nicht-eingetragen'
  onMitarbeiterClick: (mitarbeiterId: number) => void
  budgets: UrlaubBudget[]
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  filteredStats,
  statusFilter,
  getUrlaubsStatus,
  onMitarbeiterClick,
  budgets
}) => {
  return (
    <>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        👥 {statusFilter ? `Gefilterte Mitarbeiter (${filteredStats.length})` : 'Alle Mitarbeiter-Anträge'}
      </h3>
      <p className="text-base-content/70 mb-4">
        {statusFilter 
          ? `Mitarbeiter mit Status: ${statusFilter === 'eingetragen' ? 'Urlaub eingereicht' : statusFilter === 'teilweise' ? 'Urlaub teilweise eingereicht' : 'Urlaub nicht eingereicht'}`
          : 'Verwalten Sie die Urlaubsanträge aller Mitarbeiter'
        }
      </p>
      
      <div className="space-y-4">
                 {filteredStats.map(stats => {
           // Prüfe ob Mitarbeiter zu viel Urlaub beantragt hat
           // Wenn zuVerplanen negativ ist, hat er zu viel beantragt
           const hasExcessiveUrlaub = stats.zuVerplanen < 0;
           
           return (
            <div
              key={stats.id}
              className={`list-item-modern card border-2 shadow rounded-2xl cursor-pointer hover:shadow-lg transition-all ${
                hasExcessiveUrlaub 
                  ? '!border-orange-400 !bg-gradient-to-r !from-orange-50 !to-red-50' 
                  : 'border-base-300 bg-base-100'
              }`}
              onClick={() => onMitarbeiterClick(stats.id)}
            >
            <div className="card-body p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-bold text-lg">{stats.name}</div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <User className="w-4 h-4" />
                      <span>Anspruch: {stats.jahresanspruch} • Verplant: {stats.verplant} • Rest: {stats.zuVerplanen < 0 ? `-${Math.abs(stats.zuVerplanen)}` : stats.zuVerplanen}</span>
                    </div>
                    <div className="text-gray-400 text-sm">Mitarbeiter ID: {stats.id}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Status-Icon */}
                  {(() => {
                    const status = getUrlaubsStatus(stats.id)
                    switch (status) {
                      case 'eingetragen':
                        return (
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full" title="Urlaub vollständig eingetragen">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                          </div>
                        )
                      case 'teilweise':
                        return (
                          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full" title="Urlaub teilweise eingetragen">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          </div>
                        )
                      case 'nicht-eingetragen':
                        return (
                          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full" title="Urlaub nicht eingetragen">
                            <Ban className="w-5 h-5 text-red-600" />
                          </div>
                        )
                      default:
                        return (
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                            <Ban className="w-5 h-5 text-gray-400" />
                          </div>
                        )
                    }
                  })()}
                  

                  
                  {/* Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMitarbeiterClick(stats.id)
                    }}
                    className="btn btn-circle btn-outline btn-sm hover:btn-primary"
                    title="Details anzeigen"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </>
  )
}

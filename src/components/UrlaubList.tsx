import React from 'react'
import { Trash2, Calendar } from 'lucide-react'
import { Urlaub } from '../types/urlaub'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { calculateWorkingDays, formatWorkingDays } from '../utils/vacationCalculator'
// DaisyUI badges/buttons werden direkt als Klassen verwendet

interface UrlaubListProps {
  urlaube: Urlaub[]
  onDelete: (id: string) => void
  isAdmin: boolean
}

export const UrlaubList: React.FC<UrlaubListProps> = ({ urlaube, onDelete, isAdmin }) => {
  if (urlaube.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Keine Urlaubsanträge vorhanden</h3>
        <p className="text-slate-500">Es wurden noch keine Urlaubsanträge eingereicht.</p>
      </div>
    )
  }

  // Urlaube nach Startdatum sortieren (neueste zuerst)
  const sortedUrlaube = [...urlaube].sort((a, b) => 
    new Date(a.startDatum).getTime() - new Date(b.startDatum).getTime()
  )

  return (
    <div className="space-y-4">
      {sortedUrlaube.map((urlaub) => {
        const startDate = new Date(urlaub.startDatum)
        const endDate = new Date(urlaub.endDatum)
        const duration = calculateWorkingDays(startDate, endDate)
        
        return (
          <div key={urlaub.id} className="list-item-modern card border border-base-300 bg-base-100 shadow rounded-2xl">
            <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {format(startDate, 'dd.MM.yyyy', { locale: de })} - {format(endDate, 'dd.MM.yyyy', { locale: de })}
                  </div>
                  <div className="text-gray-600 mb-2">
                    {formatWorkingDays(duration)}
                    {urlaub.bemerkung && (
                      <span className="ml-3 text-gray-500 italic">
                        "{urlaub.bemerkung}"
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="text-sm text-gray-400">
                      Mitarbeiter ID: {urlaub.mitarbeiterId}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {urlaub.status === 'approved' && <div className="badge-modern badge-success-modern badge-lg">Genehmigt</div>}
                {urlaub.status === 'rejected' && <div className="badge-modern badge-error-modern badge-lg">Abgelehnt</div>}
                {urlaub.status === 'pending' && <div className="badge-modern badge-warning-modern badge-lg">Ausstehend</div>}
                
                {urlaub.status === 'pending' && (
                  <button 
                    className="btn-modern btn-outline-modern btn-sm" 
                    onClick={() => {
                      if (confirm('Möchten Sie diesen Urlaubsantrag wirklich löschen?')) {
                        onDelete(urlaub.id)
                      }
                    }} 
                    aria-label="Urlaubsantrag löschen"
                    title={isAdmin ? "Urlaubsantrag löschen (Admin)" : "Eigenen Urlaubsantrag löschen"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default UrlaubList

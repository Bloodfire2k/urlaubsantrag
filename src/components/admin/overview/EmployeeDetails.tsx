import React from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, Trash2 } from 'lucide-react'
import { Urlaub, MitarbeiterStats } from '../../../types/admin/overview'

interface EmployeeDetailsProps {
  selectedMitarbeiter: number | null
  mitarbeiterStats: MitarbeiterStats[]
  detailUrlaube: Urlaub[]
  onClose: () => void
  formatDate: (dateString: string) => string
  calculateWorkingDays: (start: Date, end: Date) => number
}

export const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  selectedMitarbeiter,
  mitarbeiterStats,
  detailUrlaube,
  onClose,
  formatDate,
  calculateWorkingDays
}) => {
  if (!selectedMitarbeiter) return null

  return createPortal(
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.4)', 
      backdropFilter: 'blur(8px)',
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center', 
      zIndex: 9999, 
      padding: '2rem',
      paddingTop: '2rem'
    }}>
      <div className="card-modern bg-base-100 shadow w-full max-w-4xl" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 className="card-title justify-center" style={{ fontSize: '24px', marginBottom: '8px' }}>
                📅 Urlaubsdetails - {mitarbeiterStats.find(s => s.id === selectedMitarbeiter)?.name}
              </h2>
              <p className="text-base-content/70 text-center">Alle Urlaubsanträge dieses Mitarbeiters</p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: '#6b7280'
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {detailUrlaube.length > 0 ? (
            <div className="space-y-4">
              {detailUrlaube.map(urlaub => (
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
                            {formatDate(urlaub.startDatum)} - {formatDate(urlaub.endDatum)}
                          </div>
                          <div className="text-gray-600 mb-2">
                            📅 {calculateWorkingDays(new Date(urlaub.startDatum), new Date(urlaub.endDatum))} Arbeitstage
                          </div>
                          <div className="text-sm text-gray-400">
                            Mitarbeiter ID: {urlaub.mitarbeiterId}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {urlaub.status === 'approved' && <div className="badge-modern badge-success-modern badge-lg">Genehmigt</div>}
                        {urlaub.status === 'rejected' && <div className="badge-modern badge-error-modern badge-lg">Abgelehnt</div>}
                        {urlaub.status === 'pending' && <div className="badge-modern badge-warning-modern badge-lg">Ausstehend</div>}
                        
                        {urlaub.status === 'pending' && (
                          <button 
                            className="btn-modern btn-outline-modern btn-sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Möchten Sie diesen Urlaubsantrag wirklich löschen?')) {
                                console.log('Lösche Urlaubsantrag:', urlaub.id)
                              }
                            }} 
                            aria-label="Urlaubsantrag löschen"
                            title="Urlaubsantrag löschen (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Urlaubsanträge</h3>
              <p className="text-gray-600">Dieser Mitarbeiter hat noch keine Urlaubsanträge eingereicht.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

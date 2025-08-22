import React from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, Trash2 } from 'lucide-react'
import { Urlaub, MitarbeiterStats } from '../../../types/admin/overview'
import { useAuth } from '../../../contexts/AuthContext'

interface EmployeeDetailsProps {
  selectedMitarbeiter: number | null
  mitarbeiterStats: MitarbeiterStats[]
  detailUrlaube: Urlaub[]
  onClose: () => void
  formatDate: (dateString: string) => string
  calculateWorkingDays: (start: Date, end: Date) => number
  handleStatusChange: (urlaubId: string, newStatus: 'approved' | 'rejected' | 'pending', e?: React.MouseEvent<HTMLButtonElement>) => void
  onDelete?: (urlaubId: string) => Promise<void>
  busyId?: string | null
  onDataChange?: () => void

}

export const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  selectedMitarbeiter,
  mitarbeiterStats,
  detailUrlaube,
  onClose,
  formatDate,
  calculateWorkingDays,
  handleStatusChange,
  onDelete,
  busyId,
  onDataChange
}) => {
  const { user } = useAuth()
  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (selectedMitarbeiter === null) return null

  return createPortal(
    <div 
      style={{ 
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
      }}
      onClick={(e) => {
        // Nur schließen wenn auf das Overlay geklickt wird, nicht auf den Inhalt
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}>
      <div 
        className="card-modern bg-base-100 shadow w-full max-w-4xl" 
        style={{ maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
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
              {detailUrlaube
                .sort((a, b) => new Date(a.startDatum).getTime() - new Date(b.startDatum).getTime())
                .map(urlaub => (
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
                      
                      <div className="actions flex items-center space-x-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        {urlaub.status === 'approved' && (
                          <div className="flex items-center gap-2">
                            <div className="badge-modern badge-success-modern badge-lg">
                              Genehmigt
                              {urlaub.genehmigtVon && <span className="text-xs ml-2">von {urlaub.genehmigtVon}</span>}
                            </div>
                            {user?.role === 'admin' && (
                              <button 
                                type="button"
                                className="btn btn-xs btn-outline text-orange-600 hover:bg-orange-50"
                                disabled={busyId === urlaub.id.toString()}
                                onClick={(e) => handleStatusChange(urlaub.id.toString(), 'pending', e)}
                              >
                                Zurücksetzen
                              </button>
                            )}
                          </div>
                        )}
                        {urlaub.status === 'rejected' && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="badge-modern badge-error-modern badge-lg">
                              Abgelehnt
                              {urlaub.genehmigtVon && <span className="text-xs ml-2">von {urlaub.genehmigtVon}</span>}
                            </div>
                            {user?.role === 'admin' && (
                              <button 
                                type="button"
                                className="btn btn-xs btn-outline text-orange-600 hover:bg-orange-50"
                                disabled={busyId === urlaub.id.toString()}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent?.stopImmediatePropagation?.();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.nativeEvent?.stopImmediatePropagation?.();
                                  console.log('🔴 ZURÜCKSETZEN Button clicked - stopping ALL propagation');
                                  handleStatusChange(urlaub.id.toString(), 'pending', e);
                                }}
                              >
                                Zurücksetzen
                              </button>
                            )}
                          </div>
                        )}
                        {urlaub.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <div className="badge-modern badge-warning-modern badge-lg">
                              Ausstehend
                            </div>
                            {user?.role === 'admin' && (
                              <div className="join">
                                <button 
                                  type="button"
                                  className="btn btn-sm join-item text-green-700 hover:bg-green-50"
                                  disabled={busyId === urlaub.id.toString()}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent?.stopImmediatePropagation?.();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent?.stopImmediatePropagation?.();
                                    console.log('🔴 GENEHMIGEN Button clicked - stopping ALL propagation');
                                    handleStatusChange(urlaub.id.toString(), 'approved', e);
                                  }}
                                >
                                  Genehmigen
                                </button>
                                <button 
                                  type="button"
                                  className="btn btn-sm join-item text-red-700 hover:bg-red-50"
                                  disabled={busyId === urlaub.id.toString()}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent?.stopImmediatePropagation?.();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent?.stopImmediatePropagation?.();
                                    console.log('🔴 ABLEHNEN Button clicked - stopping ALL propagation');
                                    handleStatusChange(urlaub.id.toString(), 'rejected', e);
                                  }}
                                >
                                  Ablehnen
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {urlaub.status === 'pending' && onDelete && user?.role === 'admin' && (
                          <button 
                            type="button"
                            className="btn-modern btn-outline-modern btn-sm" 
                            disabled={busyId === urlaub.id.toString()}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent?.stopImmediatePropagation?.();
                            }}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent?.stopImmediatePropagation?.();
                              
                              if (confirm('Möchten Sie diesen Urlaubsantrag wirklich löschen?')) {
                                try {
                                  await onDelete(urlaub.id.toString())
                                } catch (error) {
                                  console.error('Fehler beim Löschen:', error)
                                }
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

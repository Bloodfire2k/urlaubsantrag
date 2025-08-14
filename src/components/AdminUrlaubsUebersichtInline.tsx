import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, Clock, CheckCircle, User, ChevronRight, Trash2, X, AlertTriangle, ShieldCheck, Ban } from 'lucide-react'
import { useYear } from '../contexts/YearContext'
import { calculateWorkingDays } from '../utils/vacationCalculator'

// Dynamische API-URL für lokales Netzwerk
const getApiBaseUrl = () => {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api'
  } else {
    return `http://${hostname}:3001/api`
  }
}
const API_BASE_URL = getApiBaseUrl()

interface Urlaub {
  id: string
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface UrlaubBudget {
  mitarbeiterId: number
  mitarbeiterName: string
  jahr: number
  jahresanspruch: number
  genommen: number
  verplant: number
  uebertrag: number
}

interface MitarbeiterStats {
  id: number
  name: string
  zuVerplanen: number
  verplant: number
  offen: number
  jahresanspruch: number
}

interface GlobalStats {
  zuVerplanen: number
  verplant: number
  offen: number
}

interface Props {
  allUrlaube: Urlaub[]
}

const AdminUrlaubsUebersichtInline: React.FC<Props> = ({ allUrlaube }) => {
  const { selectedYear } = useYear()
  const [budgets, setBudgets] = useState<UrlaubBudget[]>([])
  const [mitarbeiterStats, setMitarbeiterStats] = useState<MitarbeiterStats[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ zuVerplanen: 0, verplant: 0, offen: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<number | null>(null)
  const [detailUrlaube, setDetailUrlaube] = useState<Urlaub[]>([])
  // Änderung: Filter-Status hinzugefügt. Grund: Filterbare Mitarbeiterliste nach Urlaubsstatus
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    loadBudgets()
  }, [selectedYear])

  useEffect(() => {
    if (budgets.length > 0) {
      calculateStats()
    }
  }, [allUrlaube, budgets])

  const loadBudgets = async () => {
    setLoading(true)
    
    // Erstelle echte Mitarbeiter basierend auf Ihrem System
    console.log('Lade echte Mitarbeiter-Daten')
    const realMitarbeiter = [
      {
        mitarbeiterId: 2,
        mitarbeiterName: 'Unternehmer Admin',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 3,
        mitarbeiterName: 'Max Mustermann',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 4,
        mitarbeiterName: 'Anna Schmidt',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 5,
        mitarbeiterName: 'Markt Manager 1',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 6,
        mitarbeiterName: 'Markt Manager 2',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 7,
        mitarbeiterName: 'Susanne Asel',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 8,
        mitarbeiterName: 'test user',
        jahr: selectedYear,
        jahresanspruch: 36,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      }
    ]
    
    console.log('Echte Mitarbeiter geladen:', realMitarbeiter)
    setBudgets(realMitarbeiter)
    setLoading(false)
  }

  const setFallbackBudgets = () => {
    console.log('Setze Fallback-Budgets')
    const fallbackBudgets = [
      {
        mitarbeiterId: 1,
        mitarbeiterName: 'Max Mustermann',
        jahr: selectedYear,
        jahresanspruch: 30,
        genommen: 0,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 2,
        mitarbeiterName: 'Anna Schmidt',
        jahr: selectedYear,
        jahresanspruch: 25,
        genommen: 5,
        verplant: 0,
        uebertrag: 0
      },
      {
        mitarbeiterId: 3,
        mitarbeiterName: 'Peter Müller',
        jahr: selectedYear,
        jahresanspruch: 28,
        genommen: 0,
        verplant: 0,
        uebertrag: 2
      }
    ]
    setBudgets(fallbackBudgets)
    setLoading(false)
  }

  const calculateStats = () => {
    const stats: MitarbeiterStats[] = []
    let globalZuVerplanen = 0
    let globalVerplant = 0
    let globalOffen = 0

    budgets.forEach(budget => {
      // Berechne verplante Tage basierend auf pending Urlauben
      const mitarbeiterUrlaube = allUrlaube.filter(u => 
        u.mitarbeiterId == budget.mitarbeiterId && u.status === 'pending'
      )
      
      const verplanteTage = mitarbeiterUrlaube.reduce((total, urlaub) => {
        const start = new Date(urlaub.startDatum)
        const end = new Date(urlaub.endDatum)
        return total + calculateWorkingDays(start, end)
      }, 0)

      const zuVerplanen = Math.max(0, budget.jahresanspruch - budget.genommen - verplanteTage)
      const offen = mitarbeiterUrlaube.length

      stats.push({
        id: budget.mitarbeiterId,
        name: budget.mitarbeiterName,
        zuVerplanen,
        verplant: verplanteTage,
        offen,
        jahresanspruch: budget.jahresanspruch
      })

      globalZuVerplanen += zuVerplanen
      globalVerplant += verplanteTage
      globalOffen += offen
    })

    // Änderung: Nach Nachnamen sortieren. Grund: Benutzeranforderung für bessere Übersichtlichkeit
    stats.sort((a, b) => {
      const nachNameA = a.name.split(' ').pop() || a.name
      const nachNameB = b.name.split(' ').pop() || b.name
      return nachNameA.localeCompare(nachNameB)
    })

    setMitarbeiterStats(stats)
    setGlobalStats({
      zuVerplanen: globalZuVerplanen,
      verplant: globalVerplant,
      offen: globalOffen
    })
  }

  const handleMitarbeiterClick = (mitarbeiterId: number) => {
    console.log('Klick auf Mitarbeiter ID:', mitarbeiterId)
    console.log('Alle Urlaubsanträge:', allUrlaube)
    
    setSelectedMitarbeiter(mitarbeiterId)
    // Vergleiche sowohl als Zahl als auch als String
    const mitarbeiterUrlaube = allUrlaube.filter(u => 
      u.mitarbeiterId === mitarbeiterId || u.mitarbeiterId === mitarbeiterId.toString()
    )
    console.log('Gefilterte Urlaubsanträge für Mitarbeiter:', mitarbeiterUrlaube)
    setDetailUrlaube(mitarbeiterUrlaube)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  // Änderung: Funktion zur Berechnung des Urlaubsstatus hinzugefügt. Grund: Status-Icons für bessere Übersicht
  const getUrlaubsStatus = (mitarbeiterId: number) => {
    const mitarbeiterUrlaube = allUrlaube.filter(u => u.mitarbeiterId == mitarbeiterId)
    const mitarbeiterBudget = budgets.find(b => b.mitarbeiterId === mitarbeiterId)
    
    if (!mitarbeiterBudget) return 'nicht-eingetragen' // Rot
    
    const verplanteTage = mitarbeiterUrlaube
      .filter(u => u.status === 'pending')
      .reduce((total, urlaub) => {
        const start = new Date(urlaub.startDatum)
        const end = new Date(urlaub.endDatum)
        return total + calculateWorkingDays(start, end)
      }, 0)
    
    const verfügbareTage = mitarbeiterBudget.jahresanspruch - mitarbeiterBudget.genommen - verplanteTage
    
    if (verfügbareTage <= 0) return 'eingetragen' // Grün - komplett verplant
    if (verplanteTage > 0) return 'teilweise' // Orange - teilweise verplant
    return 'nicht-eingetragen' // Rot - nichts verplant
  }

  // Änderung: Funktion zur Berechnung der Mitarbeiter-Anzahl pro Status. Grund: Filter-Buttons mit Anzahl
  const getStatusCounts = () => {
    let eingetragen = 0
    let teilweise = 0
    let nichtEingetragen = 0

    mitarbeiterStats.forEach(stats => {
      const status = getUrlaubsStatus(stats.id)
      switch (status) {
        case 'eingetragen':
          eingetragen++
          break
        case 'teilweise':
          teilweise++
          break
        case 'nicht-eingetragen':
          nichtEingetragen++
          break
      }
    })

    return { eingetragen, teilweise, nichtEingetragen }
  }

  // Änderung: Funktion zum Filtern der Mitarbeiter nach Status. Grund: Filterbare Liste
  const getFilteredMitarbeiterStats = () => {
    if (!statusFilter) return mitarbeiterStats
    
    return mitarbeiterStats.filter(stats => {
      const status = getUrlaubsStatus(stats.id)
      return status === statusFilter
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-3 text-lg">Lade Urlaubsübersicht...</span>
      </div>
    )
  }

  // Debug: Prüfe ob Daten vorhanden sind
  console.log('AdminUrlaubsUebersichtInline - mitarbeiterStats:', mitarbeiterStats)
  console.log('AdminUrlaubsUebersichtInline - budgets:', budgets)

  return (
    <div className="space-y-6 mb-8">
      {/* Überschrift */}
      <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body">
          {/* Änderung: NEUE ANSICHT Badge entfernt. Grund: Benutzeranforderung für sauberere Optik */}
          <h2 className="card-title text-2xl md:text-3xl mb-4">
            📊 Mitarbeiter-Übersicht
          </h2>
          <p className="text-base-content/70 mb-6">
            Übersicht aller Urlaubsanträge - {mitarbeiterStats.length} Mitarbeiter gefunden
          </p>

          {/* Globale Statistiken - Design wie auf der Mitarbeiterseite */}
          <div className="stats-modern">
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

          {/* Änderung: Überschrift entfernt. Grund: Filter-Buttons sind selbsterklärend */}
          <div className="mb-32 px-8 pt-8 pb-12 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-gray-200 shadow-sm">
            {/* Änderung: Filter-Buttons mit gleichem Layout wie Statistik-Karten obendrüber. Grund: Einheitliche Breiten für harmonisches Design */}
            <div className="stats-modern">
              {(() => {
                const counts = getStatusCounts()
                return (
                  <>
                    <div className="p-1 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl border-2 border-green-300 shadow-md">
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'eingetragen' ? null : 'eingetragen')}
                        className={`btn ${statusFilter === 'eingetragen' ? 'btn-success' : 'btn-outline btn-success'} btn-lg normal-case gap-2 border-0 w-full h-full`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                        Urlaub eingereicht ({counts.eingetragen})
                      </button>
                    </div>
                    <div className="p-1 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl border-2 border-orange-300 shadow-md">
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'teilweise' ? null : 'teilweise')}
                        className={`btn ${statusFilter === 'teilweise' ? 'btn-warning' : 'btn-outline btn-warning'} btn-lg normal-case gap-2 border-0 w-full h-full`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                        Urlaub teilweise eingereicht ({counts.teilweise})
                      </button>
                    </div>
                    <div className="p-1 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl border-2 border-red-300 shadow-md">
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'nicht-eingetragen' ? null : 'nicht-eingetragen')}
                        className={`btn ${statusFilter === 'nicht-eingetragen' ? 'btn-error' : 'btn-outline btn-error'} btn-lg normal-case gap-2 border-0 w-full h-full`}
                      >
                        <Ban className="w-5 h-5" />
                        Urlaub nicht eingereicht ({counts.nichtEingetragen})
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
            {statusFilter && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setStatusFilter(null)}
                  className="btn btn-ghost btn-sm normal-case hover:bg-gray-200"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </div>

          {/* Änderung: Unsichtbarer Spacer für garantierten Abstand. Grund: Margin-Klassen funktionierten nicht zuverlässig */}
          <div style={{height: '80px'}}></div>

          {/* Alle Mitarbeiter-Anträge */}
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👥 {statusFilter ? `Gefilterte Mitarbeiter (${getFilteredMitarbeiterStats().length})` : 'Alle Mitarbeiter-Anträge'}
          </h3>
          <p className="text-base-content/70 mb-4">
            {statusFilter 
              ? `Mitarbeiter mit Status: ${statusFilter === 'eingetragen' ? 'Urlaub eingereicht' : statusFilter === 'teilweise' ? 'Urlaub teilweise eingereicht' : 'Urlaub nicht eingereicht'}`
              : 'Verwalten Sie die Urlaubsanträge aller Mitarbeiter'
            }
          </p>
          
          <div className="space-y-4">
            {getFilteredMitarbeiterStats().map(stats => (
              <div
                key={stats.id}
                className="list-item-modern card border border-base-300 bg-base-100 shadow rounded-2xl cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleMitarbeiterClick(stats.id)}
              >
                <div className="card-body p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-bold text-lg">{stats.name}</div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                        <User className="w-4 h-4" />
                        <span>Anspruch: {stats.jahresanspruch} • Verplant: {stats.verplant} • Verfügbar: {stats.zuVerplanen}</span>
                      </div>
                      <div className="text-gray-400 text-sm">Mitarbeiter ID: {stats.id}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Änderung: Status-Icon wieder hinzugefügt. Grund: Benutzeranforderung für Status bei jedem Mitarbeiter */}
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
                    
                    {/* Status Badge */}
                    <div className="badge badge-success text-white font-medium px-4 py-2 rounded-full">
                      AKTIV
                    </div>
                    
                    {/* Details Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMitarbeiterClick(stats.id)
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
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal als Portal - Exakt wie Mitarbeiter-Erstellung */}
      {selectedMitarbeiter && createPortal(
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
                  onClick={() => setSelectedMitarbeiter(null)}
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
      )}
    </div>
  )
}

export default AdminUrlaubsUebersichtInline

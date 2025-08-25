import React, { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, AlertCircle, User, ChevronRight, Users } from 'lucide-react'
import { useYear } from '../contexts/YearContext'
import { calculateWorkingDays } from '../utils/vacationCalculator'
import { httpGetJson } from '../../lib/http'
import { fetchUsersList } from '../../lib/users'

// Hilfsfunktion für fetch mit Token
function fetchWithToken(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('urlaub_token')
  if (!token) {
    throw new Error('Kein gültiges Token gefunden')
  }
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
}

interface Urlaub {
  id: number
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

const AdminUrlaubsUebersicht: React.FC = () => {
  const { selectedYear } = useYear()
  const [urlaube, setUrlaube] = useState<Urlaub[]>([])
  const [budgets, setBudgets] = useState<UrlaubBudget[]>([])
  const [mitarbeiterStats, setMitarbeiterStats] = useState<MitarbeiterStats[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ zuVerplanen: 0, verplant: 0, offen: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<number | null>(null)
  const [detailUrlaube, setDetailUrlaube] = useState<Urlaub[]>([])

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadUrlaube(),
        loadBudgets(),
        loadUsers()
      ])
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUrlaube = async () => {
    try {
      const data = await httpGetJson(`/urlaub?jahr=${selectedYear}`)
      const urlaubAntraege = data.urlaubAntraege || []
      setUrlaube(urlaubAntraege)
    } catch (error) {
      console.error('Fehler beim Laden der Urlaube:', error)
    }
  }

  const loadBudgets = async () => {
    try {
      const token = localStorage.getItem('urlaub_token')
      if (!token) return

      // Lade alle Benutzer zuerst um ihre IDs zu bekommen (nur aktive)
      const result = await fetchUsersList()
      // Filtere nur aktive Benutzer
      const activeUsers = result.items.filter((user: any) => user.isActive !== false)
        const budgetPromises = activeUsers.map(async (user: any) => {
          try {
            const budgetResponse = await fetchWithToken(`/urlaub/budget/${user.id}?jahr=${selectedYear}`)
            
            if (budgetResponse.ok) {
              const budgetData = await budgetResponse.json()
              return {
                mitarbeiterId: user.id,
                mitarbeiterName: user.fullName || user.full_name || `${user.username}`,
                jahr: selectedYear,
                jahresanspruch: budgetData.budget?.jahresanspruch || 30,
                genommen: budgetData.budget?.genommen || 0,
                verplant: budgetData.budget?.verplant || 0,
                uebertrag: budgetData.budget?.uebertrag || 0
              }
            }
            return null
          } catch (error) {
            console.error(`Fehler beim Laden des Budgets für User ${user.id}:`, error)
            return null
          }
        })

        const budgetResults = await Promise.all(budgetPromises)
        const validBudgets = budgetResults.filter(budget => budget !== null) as UrlaubBudget[]
        setBudgets(validBudgets)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budgets:', error)
    }
  }

  const loadUsers = async () => {
    // Diese Funktion wird verwendet um sicherzustellen, dass wir alle aktiven Benutzer haben
    // Die eigentliche Logik ist bereits in loadBudgets() integriert
  }

  useEffect(() => {
    if (urlaube.length > 0 && budgets.length > 0) {
      calculateStats()
    }
  }, [urlaube, budgets])

  const calculateStats = () => {
    const stats: MitarbeiterStats[] = []
    let globalZuVerplanen = 0
    let globalVerplant = 0
    let globalOffen = 0

    budgets.forEach(budget => {
      // Berechne verplante Tage basierend auf pending Urlauben
      const mitarbeiterUrlaube = urlaube.filter(u => 
        u.mitarbeiterId === budget.mitarbeiterId && u.status === 'pending'
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

    setMitarbeiterStats(stats)
    setGlobalStats({
      zuVerplanen: globalZuVerplanen,
      verplant: globalVerplant,
      offen: globalOffen
    })
  }

  const handleMitarbeiterClick = (mitarbeiterId: number) => {
    setSelectedMitarbeiter(mitarbeiterId)
    const mitarbeiterUrlaube = urlaube.filter(u => u.mitarbeiterId === mitarbeiterId)
    setDetailUrlaube(mitarbeiterUrlaube)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-3 text-lg">Lade Urlaubsübersicht...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Urlaubsübersicht {selectedYear}
        </h2>
      </div>

      {/* Globale Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-blue-50 rounded-lg border border-blue-200">
          <div className="stat-figure text-blue-500">
            <Clock className="w-8 h-8" />
          </div>
          <div className="stat-title text-blue-700">Urlaub zu verplanen</div>
          <div className="stat-value text-blue-900">{globalStats.zuVerplanen}</div>
          <div className="stat-desc text-blue-600">Tage verfügbar</div>
        </div>

        <div className="stat bg-green-50 rounded-lg border border-green-200">
          <div className="stat-figure text-green-500">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="stat-title text-green-700">Bereits verplant</div>
          <div className="stat-value text-green-900">{globalStats.verplant}</div>
          <div className="stat-desc text-green-600">Arbeitstage</div>
        </div>

        <div className="stat bg-orange-50 rounded-lg border border-orange-200">
          <div className="stat-figure text-orange-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="stat-title text-orange-700">Noch offen</div>
          <div className="stat-value text-orange-900">{globalStats.offen}</div>
          <div className="stat-desc text-orange-600">Anträge</div>
        </div>
      </div>

      {/* Mitarbeiter-spezifische Bereiche */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Mitarbeiter-Übersicht
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mitarbeiterStats.map(stats => (
            <div
              key={stats.id}
              className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer border"
              onClick={() => handleMitarbeiterClick(stats.id)}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">{stats.name}</h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Zu verplanen</div>
                    <div className="font-bold text-blue-600">{stats.zuVerplanen}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Verplant</div>
                    <div className="font-bold text-green-600">{stats.verplant}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Offen</div>
                    <div className="font-bold text-orange-600">{stats.offen}</div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Jahresanspruch: {stats.jahresanspruch} Tage
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMitarbeiter && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              Urlaubsdetails - {mitarbeiterStats.find(s => s.id === selectedMitarbeiter)?.name}
            </h3>
            
            {detailUrlaube.length > 0 ? (
              <div className="space-y-3">
                {detailUrlaube.map(urlaub => (
                  <div key={urlaub.id} className="card bg-base-50 p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">
                          {formatDate(urlaub.startDatum)} - {formatDate(urlaub.endDatum)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {calculateWorkingDays(new Date(urlaub.startDatum), new Date(urlaub.endDatum))} Arbeitstage
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`badge ${
                          urlaub.status === 'pending' ? 'badge-warning' :
                          urlaub.status === 'approved' ? 'badge-success' :
                          'badge-error'
                        }`}>
                          {urlaub.status === 'pending' ? 'Offen' :
                           urlaub.status === 'approved' ? 'Genehmigt' :
                           'Abgelehnt'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Eingereicht: {formatDate(urlaub.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Keine Urlaubsanträge vorhanden
              </div>
            )}
            
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                onClick={() => setSelectedMitarbeiter(null)}
              >
                Schließen
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedMitarbeiter(null)}></div>
        </div>
      )}
    </div>
  )
}

export default AdminUrlaubsUebersicht

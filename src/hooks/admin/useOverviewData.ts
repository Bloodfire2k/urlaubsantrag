import { useState, useEffect } from 'react'
import { Urlaub, UrlaubBudget, MitarbeiterStats, GlobalStats, StatusCounts } from '../../types/admin/overview'
import { overviewService } from '../../services/admin/overviewService'

export const useOverviewData = (allUrlaube: Urlaub[], selectedYear: number, token?: string) => {
  const [budgets, setBudgets] = useState<UrlaubBudget[]>([])
  const [mitarbeiterStats, setMitarbeiterStats] = useState<MitarbeiterStats[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ zuVerplanen: 0, verplant: 0, offen: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<number | null>(null)
  const [detailUrlaube, setDetailUrlaube] = useState<Urlaub[]>([])
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Budgets laden
  useEffect(() => {
    const loadBudgets = async () => {
      setLoading(true)
      try {
        const loadedBudgets = await overviewService.loadBudgets(selectedYear, token)
        setBudgets(loadedBudgets)
      } catch (error) {
        console.error('Fehler beim Laden der Budgets:', error)
        // Zeige Fehlermeldung im UI
        if (error instanceof Error) {
          // TODO: Fehlerbehandlung im UI implementieren
          console.error('Fehler:', error.message)
        }
      } finally {
        setLoading(false)
      }
    }
    loadBudgets()
  }, [selectedYear, token])

  // Statistiken berechnen
  useEffect(() => {
    if (budgets.length > 0) {
      const { mitarbeiterStats: stats, globalStats: global } = overviewService.calculateStats(budgets, allUrlaube)
      setMitarbeiterStats(stats)
      setGlobalStats(global)
    }
  }, [allUrlaube, budgets])

  // Mitarbeiter-Details anzeigen
  const handleMitarbeiterClick = (mitarbeiterId: number) => {
    setSelectedMitarbeiter(mitarbeiterId)
    const mitarbeiterUrlaube = allUrlaube.filter(u => 
      u.mitarbeiterId === mitarbeiterId || u.mitarbeiterId === mitarbeiterId.toString()
    )
    setDetailUrlaube(mitarbeiterUrlaube)
  }

  // Status-Counts berechnen
  const getStatusCounts = (): StatusCounts => {
    let eingetragen = 0
    let teilweise = 0
    let nichtEingetragen = 0

    mitarbeiterStats.forEach(stats => {
      const status = overviewService.getUrlaubsStatus(stats.id, allUrlaube, budgets)
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

  // Gefilterte Mitarbeiter
  const getFilteredMitarbeiterStats = () => {
    if (!statusFilter) return mitarbeiterStats
    
    return mitarbeiterStats.filter(stats => {
      const status = overviewService.getUrlaubsStatus(stats.id, allUrlaube, budgets)
      return status === statusFilter
    })
  }

  return {
    budgets,
    mitarbeiterStats,
    globalStats,
    loading,
    selectedMitarbeiter,
    setSelectedMitarbeiter,
    detailUrlaube,
    statusFilter,
    setStatusFilter,
    handleMitarbeiterClick,
    getStatusCounts,
    getFilteredMitarbeiterStats,
    getUrlaubsStatus: (mitarbeiterId: number) => overviewService.getUrlaubsStatus(mitarbeiterId, allUrlaube, budgets),
    formatDate: overviewService.formatDate
  }
}

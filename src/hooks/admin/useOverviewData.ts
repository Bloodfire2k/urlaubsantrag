import { useState, useEffect } from 'react'
import { Urlaub, UrlaubBudget, MitarbeiterStats, GlobalStats, StatusCounts } from '../../types/admin/overview'
import { overviewService } from '../../services/admin/overviewService'

export const useOverviewData = (allUrlaube: Urlaub[], selectedYear: number, selectedMitarbeiter: number | null, setSelectedMitarbeiter: (id: number | null) => void, token?: string, onDataChange?: () => void) => {
  const [budgets, setBudgets] = useState<UrlaubBudget[]>([])
  const [mitarbeiterStats, setMitarbeiterStats] = useState<MitarbeiterStats[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ zuVerplanen: 0, verplant: 0, offen: 0 })
  const [loading, setLoading] = useState(true)

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
        if (error instanceof Error) {
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

  // DetailUrlaube automatisch aktualisieren wenn allUrlaube sich ändern
  useEffect(() => {
    if (selectedMitarbeiter) {
      const mitarbeiterUrlaube = allUrlaube.filter(u => 
        u.mitarbeiterId === selectedMitarbeiter || u.mitarbeiterId === selectedMitarbeiter.toString()
      )
      setDetailUrlaube(mitarbeiterUrlaube)
    }
  }, [allUrlaube, selectedMitarbeiter])

  // Debug: Logge Änderungen der allUrlaube
  useEffect(() => {
    console.log('🔄 useOverviewData: allUrlaube geändert, Anzahl:', allUrlaube.length);
    console.log('🔄 useOverviewData: Status der Urlaube:', allUrlaube.map(u => ({ id: u.id, status: u.status })));
  }, [allUrlaube]);

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
    
    if (statusFilter === 'kritisch') {
      return mitarbeiterStats.filter(stats => stats.zuVerplanen < 0)
    }
    
    return mitarbeiterStats.filter(stats => {
      const status = overviewService.getUrlaubsStatus(stats.id, allUrlaube, budgets)
      return status === statusFilter
    })
  }

  const handleStatusChange = async (urlaubId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    if (!token) {
      console.error('Kein Token verfügbar')
      return
    }

    try {
      console.log('Sende Status-Update:', { urlaubId, newStatus })
      
      const response = await fetch(`http://localhost:3002/api/urlaub/${urlaubId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      console.log('Response Status:', response.status)
      const responseText = await response.text()
      console.log('Response Text:', responseText)

      if (!response.ok) {
        throw new Error(`Fehler beim Aktualisieren des Status: ${response.status} ${responseText}`)
      }

      let updatedAntrag
      try {
        updatedAntrag = JSON.parse(responseText)
      } catch (e) {
        console.error('Fehler beim Parsen der Antwort:', e)
        throw new Error('Ungültige Server-Antwort')
      }

      console.log('Status erfolgreich aktualisiert:', updatedAntrag)

      // Aktualisiere die lokalen Daten
      setDetailUrlaube(prev => 
        prev.map(urlaub => 
          urlaub.id === urlaubId 
            ? { ...urlaub, status: newStatus } 
            : urlaub
        )
      )

      // Budgets und Stats neu laden
      const loadedBudgets = await overviewService.loadBudgets(selectedYear, token)
      setBudgets(loadedBudgets)
      
      // onDataChange aufrufen um App.tsx zu informieren, dass sich Daten geändert haben
      if (onDataChange) {
        onDataChange()
      }
      
      // Modal bleibt offen - Daten werden durch useEffect aktualisiert
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error)
      // Fehler nicht weiterwerfen, damit Modal offen bleibt
      // throw error
    }
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
    handleStatusChange,
    getStatusCounts,
    getFilteredMitarbeiterStats,
    getUrlaubsStatus: (mitarbeiterId: number) => overviewService.getUrlaubsStatus(mitarbeiterId, allUrlaube, budgets),
    formatDate: overviewService.formatDate
  }
}
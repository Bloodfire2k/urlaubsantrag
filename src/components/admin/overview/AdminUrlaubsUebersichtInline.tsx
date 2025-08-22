import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { useYear } from '../../../contexts/YearContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useOverviewData } from '../../../hooks/admin/useOverviewData'
import { calculateWorkingDays } from '../../../utils/vacationCalculator'
import { OverviewStats } from './OverviewStats'
import { OverviewFilters } from './OverviewFilters'
import { EmployeeList } from './EmployeeList'
import { EmployeeDetails } from './EmployeeDetails'
import { Urlaub } from '../../../types/admin/overview'

interface Props {
  allUrlaube: Urlaub[]
  onDataChange?: () => void
  selectedMitarbeiter: number | null
  setSelectedMitarbeiter: (id: number | null) => void
}

const AdminUrlaubsUebersichtInline: React.FC<Props> = ({ allUrlaube, onDataChange, selectedMitarbeiter, setSelectedMitarbeiter }) => {
  const { selectedYear } = useYear()
  const { getToken } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const {
    budgets,
    mitarbeiterStats,
    globalStats,
    loading,
    detailUrlaube,
    statusFilter,
    setStatusFilter,
    handleMitarbeiterClick,
    getStatusCounts,
    getFilteredMitarbeiterStats,
    getUrlaubsStatus,
    formatDate,
    handleStatusChange
  } = useOverviewData(allUrlaube, selectedYear, selectedMitarbeiter, setSelectedMitarbeiter, getToken(), onDataChange)

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-3 text-lg">Lade Urlaubsübersicht...</span>
      </div>
    )
  }

  // Gefilterte Mitarbeiterstatistiken basierend auf Suchterm
  const getSearchFilteredStats = () => {
    const filteredStats = getFilteredMitarbeiterStats()
    if (!searchTerm) return filteredStats
    
    return filteredStats.filter(stats =>
      stats.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Überschrift */}
      <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl md:text-3xl mb-4">
            Mitarbeiter-Übersicht
          </h2>
          <p className="text-base-content/70 mb-6">
            Übersicht aller Urlaubsanträge - {mitarbeiterStats.length} Mitarbeiter gefunden
          </p>

          {/* Globale Statistiken */}
          <OverviewStats
            globalStats={globalStats}
            budgets={budgets}
            mitarbeiterStats={mitarbeiterStats}
          />

          {/* Filter */}
          <OverviewFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusCounts={getStatusCounts()}
            kritischeFaelle={mitarbeiterStats.filter(stats => stats.zuVerplanen < 0).length}
          />

          {/* Unsichtbarer Spacer für garantierten Abstand */}
          <div style={{height: '80px'}}></div>

          {/* Suchfeld */}
          <div className="list-item-modern card border-2 border-base-300 bg-base-100 shadow rounded-2xl mb-6">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-700">Mitarbeiter durchsuchen</span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full rounded-lg"
                placeholder="Nach Mitarbeitern suchen (Name)"
              />
            </div>
          </div>

          {/* Mitarbeiterliste */}
          <EmployeeList
            filteredStats={getSearchFilteredStats()}
            statusFilter={statusFilter}
            getUrlaubsStatus={getUrlaubsStatus}
            onMitarbeiterClick={handleMitarbeiterClick}
            budgets={budgets}
          />


        </div>
      </div>

      {/* Details Modal */}
      <EmployeeDetails
        selectedMitarbeiter={selectedMitarbeiter}
        mitarbeiterStats={mitarbeiterStats}
        detailUrlaube={detailUrlaube}
        onClose={() => setSelectedMitarbeiter(null)}
        formatDate={formatDate}
        calculateWorkingDays={calculateWorkingDays}
        handleStatusChange={handleStatusChange}
        onDataChange={onDataChange}
      />
    </div>
  )
}

export default AdminUrlaubsUebersichtInline

import React from 'react'
import { useYear } from '../../../contexts/YearContext'
import { useOverviewData } from '../../../hooks/admin/useOverviewData'
import { calculateWorkingDays } from '../../../utils/vacationCalculator'
import { OverviewStats } from './OverviewStats'
import { OverviewFilters } from './OverviewFilters'
import { EmployeeList } from './EmployeeList'
import { EmployeeDetails } from './EmployeeDetails'
import { Urlaub } from '../../../types/admin/overview'

interface Props {
  allUrlaube: Urlaub[]
}

const AdminUrlaubsUebersichtInline: React.FC<Props> = ({ allUrlaube }) => {
  const { selectedYear } = useYear()
  const {
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
    getUrlaubsStatus,
    formatDate
  } = useOverviewData(allUrlaube, selectedYear)

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-3 text-lg">Lade Urlaubsübersicht...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Überschrift */}
      <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl md:text-3xl mb-4">
            📊 Mitarbeiter-Übersicht
          </h2>
          <p className="text-base-content/70 mb-6">
            Übersicht aller Urlaubsanträge - {mitarbeiterStats.length} Mitarbeiter gefunden
          </p>

          {/* Globale Statistiken */}
          <OverviewStats
            globalStats={globalStats}
            budgets={budgets}
          />

          {/* Filter */}
          <OverviewFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusCounts={getStatusCounts()}
          />

          {/* Unsichtbarer Spacer für garantierten Abstand */}
          <div style={{height: '80px'}}></div>

          {/* Mitarbeiterliste */}
          <EmployeeList
            filteredStats={getFilteredMitarbeiterStats()}
            statusFilter={statusFilter}
            getUrlaubsStatus={getUrlaubsStatus}
            onMitarbeiterClick={handleMitarbeiterClick}
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
      />
    </div>
  )
}

export default AdminUrlaubsUebersichtInline

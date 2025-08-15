import React, { useState } from 'react'
import { useYear } from '../../contexts/YearContext'
import { useAuth } from '../../contexts/AuthContext'
import { useVacationData } from '../../hooks/vacation/useVacationData'
import { useVacationCalendar } from '../../hooks/vacation/useVacationCalendar'
import { VacationFilters } from './VacationFilters'
import { VacationCalendar } from './VacationCalendar'
import { NoEmployeesFound } from './NoEmployeesFound'

const Pruefung: React.FC = () => {
  const { selectedYear } = useYear()
  const { user, getToken } = useAuth()
  const token = getToken()
  
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')

  const { markets, users, urlaube, loading } = useVacationData(token, selectedYear)

  const {
    currentMonth,
    monthDays,
    filteredEmployees,
    visibleEmployees,
    isHoliday,
    hasVacationOnDay,
    navigateMonth,
    toggleEmployeeVisibility
  } = useVacationCalendar(users, urlaube, selectedMarket, selectedDepartment)

  // Zeige Loading nur wenn wirklich geladen wird
  if (loading && token && user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Zeige Authentifizierungshinweis wenn nicht eingeloggt
  if (!token || !user) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
            Prüfung
          </h1>
          <div className="mt-8 p-8 bg-warning/10 border border-warning/20 rounded-2xl">
            <p className="text-lg text-warning">⚠️ Sie müssen eingeloggt sein, um diese Seite zu verwenden.</p>
            <p className="text-sm text-base-content/70 mt-2">Bitte loggen Sie sich ein und versuchen Sie es erneut.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
          Prüfung
        </h1>
        <p className="text-base md:text-lg text-base-content/70 mt-2">
          Abteilungs-Urlaubsübersicht zur Personalplanung - Jahr {selectedYear}
          <span className="text-sm text-blue-600 ml-2">(Urlaubsdaten werden für Jahr {selectedYear} geladen)</span>
        </p>
      </div>

      {/* Filter */}
      <VacationFilters
        markets={markets}
        selectedMarket={selectedMarket}
        selectedDepartment={selectedDepartment}
        onMarketChange={(marketId) => {
          setSelectedMarket(marketId)
          setSelectedDepartment('')
        }}
        onDepartmentChange={setSelectedDepartment}
      />

      {/* Kalender */}
      {filteredEmployees.length > 0 ? (
        <VacationCalendar
          markets={markets}
          selectedMarket={selectedMarket}
          selectedDepartment={selectedDepartment}
          filteredEmployees={filteredEmployees}
          visibleEmployees={visibleEmployees}
          currentMonth={currentMonth}
          monthDays={monthDays}
          isHoliday={isHoliday}
          hasVacationOnDay={hasVacationOnDay}
          navigateMonth={navigateMonth}
          toggleEmployeeVisibility={toggleEmployeeVisibility}
        />
      ) : (
        <NoEmployeesFound
          selectedMarket={selectedMarket}
          selectedDepartment={selectedDepartment}
        />
      )}
    </div>
  )
}

export default Pruefung

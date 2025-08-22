import React, { useState, useEffect, useRef } from 'react'
import { useYear } from '../../contexts/YearContext'
import { useAuth } from '../../contexts/AuthContext'
import { useVacationData } from '../../hooks/vacation/useVacationData'
import { useVacationCalendar } from '../../hooks/vacation/useVacationCalendar'
import { VacationFilters } from './VacationFilters'
import { VacationCalendar } from './VacationCalendar'
import { NoEmployeesFound } from './NoEmployeesFound'
import { EmployeeDetails } from '../admin/overview/EmployeeDetails'
import { apiFetch } from '../../lib/api'

const Pruefung: React.FC = () => {
  const { selectedYear } = useYear()
  const { user, getToken } = useAuth()
  const token = getToken()
  
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const selectedEmployeeRef = useRef<number | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { markets, users, urlaube: dataUrlaube, loading } = useVacationData(token, selectedYear)
  const [urlaube, setUrlaube] = useState(dataUrlaube ?? [])

  useEffect(() => {
    setUrlaube(dataUrlaube ?? [])
  }, [dataUrlaube])

  const {
    currentMonth,
    monthDays,
    filteredEmployees,
    visibleEmployees,
    isHoliday,
    hasVacationOnDay,
    hasRejectedVacationOnDay,
    getVacationStatusOnDay,
    navigateMonth,
    toggleEmployeeVisibility
  } = useVacationCalendar(users, urlaube, selectedMarket, selectedDepartment, selectedYear)

  // Gefilterte Urlaube für den aktuellen Monat
  const monthlyUrlaube = urlaube.filter(urlaub => {
    const urlaubDate = new Date(urlaub.startDatum)
    return urlaubDate.getFullYear() === currentMonth.getFullYear() && 
           urlaubDate.getMonth() === currentMonth.getMonth()
  })

  const handleEmployeeClick = (employeeId: number) => {
    setSelectedEmployee(employeeId)
    selectedEmployeeRef.current = employeeId
  }

  const handleStatusChange = async (urlaubId: string, newStatus: 'approved' | 'rejected' | 'pending', e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('🔧 handleStatusChange called, urlaubId:', urlaubId, 'newStatus:', newStatus);
    console.log('🔍 selectedEmployee before:', selectedEmployee);
    
    // selectedEmployee sichern BEVOR State-Updates
    const currentSelectedEmployee = selectedEmployee;
    
    const snapshot = [...(urlaube ?? [])];
    setUrlaube(prev => (prev ?? []).map(u =>
      u.id.toString() === urlaubId ? { ...u, status: newStatus } : u
    ));
    setBusyId(urlaubId);

    try {
      const response = await apiFetch(`/urlaub/${urlaubId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('API Fehler')
      
      console.log('✅ Status erfolgreich geändert, Modal bleibt offen')
      
      // WICHTIG: Modal-State nach API-Success explizit wiederherstellen
      console.log('🔒 Modal-State nach API-Success wiederherstellen:', currentSelectedEmployee);
      setSelectedEmployee(currentSelectedEmployee);
      
    } catch (error) {
      console.error('❌ Fehler:', error)
      setUrlaube(snapshot)
      // Bei Fehler auch selectedEmployee wiederherstellen
      setSelectedEmployee(currentSelectedEmployee);
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (urlaubId: string) => {
    console.log('🗑️ handleDelete called, urlaubId:', urlaubId);
    
    // selectedEmployee sichern BEVOR State-Updates
    const currentSelectedEmployee = selectedEmployee;
    
    const snapshot = [...(urlaube ?? [])];
    // Optimistic Update: Urlaub aus der Liste entfernen
    setUrlaube(prev => (prev ?? []).filter(u => u.id.toString() !== urlaubId));
    setBusyId(urlaubId);

    try {
      const response = await apiFetch(`/urlaub/${urlaubId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('API Fehler beim Löschen')
      
      console.log('✅ Urlaub erfolgreich gelöscht, Modal bleibt offen')
      
      // WICHTIG: Modal-State nach API-Success explizit wiederherstellen
      console.log('🔒 Modal-State nach API-Success wiederherstellen:', currentSelectedEmployee);
      setSelectedEmployee(currentSelectedEmployee);
      
    } catch (error) {
      console.error('❌ Fehler beim Löschen:', error)
      setUrlaube(snapshot)
      // Bei Fehler auch selectedEmployee wiederherstellen
      setSelectedEmployee(currentSelectedEmployee);
    } finally {
      setBusyId(null)
    }
  }

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
          hasRejectedVacationOnDay={hasRejectedVacationOnDay}
          getVacationStatusOnDay={getVacationStatusOnDay}
          navigateMonth={navigateMonth}
          toggleEmployeeVisibility={toggleEmployeeVisibility}
          handleEmployeeClick={handleEmployeeClick}
        />
      ) : (
        <NoEmployeesFound
          selectedMarket={selectedMarket}
          selectedDepartment={selectedDepartment}
        />
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          selectedMitarbeiter={selectedEmployee}
          mitarbeiterStats={[]}
          detailUrlaube={monthlyUrlaube.filter(u => u.mitarbeiterId === selectedEmployee)}
          onClose={() => {
            setSelectedEmployee(null)
            selectedEmployeeRef.current = null
          }}
          formatDate={(date) => new Date(date).toLocaleDateString('de-DE')}
          calculateWorkingDays={(start, end) => Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1}
          handleStatusChange={handleStatusChange}
          onDelete={handleDelete}
          busyId={busyId}
        />
      )}
    </div>
  )
}

export default Pruefung

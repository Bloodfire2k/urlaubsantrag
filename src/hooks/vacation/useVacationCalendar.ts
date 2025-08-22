import { useState, useMemo } from 'react'
import { User, Urlaub } from '../../types/vacation'

export const useVacationCalendar = (
  users: User[],
  urlaube: Urlaub[],
  selectedMarket: number | null,
  selectedDepartment: string,
  selectedYear?: number
) => {
  // Starte immer im Januar des ausgewählten Jahres
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date()
    date.setFullYear(selectedYear || date.getFullYear())
    date.setMonth(0) // Januar
    date.setDate(1)  // Erster Tag des Monats
    return date
  })
  const [visibleEmployees, setVisibleEmployees] = useState<Set<number>>(new Set())

  // Gefilterte Mitarbeiter basierend auf Markt und verfügbaren Abteilungen
  const filteredEmployees = useMemo(() => {
    if (!selectedMarket) return []

    // Definiere welche Abteilungen zusammen angezeigt werden sollen
    const departmentGroups: { [key: string]: string[] } = {
      'Kasse': ['Kasse', 'Markt', 'Bäckerei'],
      'Markt': ['Markt', 'Kasse', 'Bäckerei'],
      'Bäckerei': ['Bäckerei', 'Markt', 'Kasse'],
      'Metzgerei': ['Metzgerei'] // Metzgerei bleibt alleine
    }

    // Hole die relevanten Abteilungen für die ausgewählte Abteilung
    const relevantDepartments = selectedDepartment ? 
      (departmentGroups[selectedDepartment] || [selectedDepartment]) : 
      []

    return users.filter(user => 
      user.market_id === selectedMarket &&
      (!selectedDepartment || relevantDepartments.includes(user.department))
    )
  }, [users, selectedMarket, selectedDepartment])

  // Gefilterte Urlaubsanträge
  const filteredUrlaube = useMemo(() => {
    if (!selectedMarket || filteredEmployees.length === 0) {
      return []
    }
    
    const filteredEmployeeIds = filteredEmployees.map(emp => emp.id)
    return urlaube.filter(urlaubsantrag => 
      filteredEmployeeIds.includes(urlaubsantrag.mitarbeiterId)
    )
  }, [urlaube, filteredEmployees, selectedMarket])

  // Urlaubstage-Map für gefilterte Mitarbeiter (genehmigte und pending)
  const vacationDaysMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    
    filteredUrlaube.forEach(urlaub => {
      if (urlaub.status === 'rejected') return
      
      const employeeKey = urlaub.mitarbeiterId.toString()
      if (!map.has(employeeKey)) {
        map.set(employeeKey, new Set())
      }
      
      const startDate = new Date(urlaub.startDatum)
      const endDate = new Date(urlaub.endDatum)
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        map.get(employeeKey)!.add(dateStr)
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })
    
    return map
  }, [filteredUrlaube])

  // Abgelehnte Urlaubstage-Map für gefilterte Mitarbeiter
  const rejectedVacationDaysMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    
    filteredUrlaube.forEach(urlaub => {
      if (urlaub.status !== 'rejected') return
      
      const employeeKey = urlaub.mitarbeiterId.toString()
      if (!map.has(employeeKey)) {
        map.set(employeeKey, new Set())
      }
      
      const startDate = new Date(urlaub.startDatum)
      const endDate = new Date(urlaub.endDatum)
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        map.get(employeeKey)!.add(dateStr)
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })
    
    return map
  }, [filteredUrlaube])

  // Monatsdaten generieren
  const monthDays = useMemo(() => {
    const days = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }, [currentMonth])

  // Deutsche Feiertage
  const holidays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const holidays = []
    
    // Feste Feiertage
    holidays.push(new Date(year, 0, 1))   // Neujahr
    holidays.push(new Date(year, 4, 1))   // Tag der Arbeit
    holidays.push(new Date(year, 9, 3))   // Tag der Deutschen Einheit
    holidays.push(new Date(year, 11, 25)) // 1. Weihnachtstag
    holidays.push(new Date(year, 11, 26)) // 2. Weihnachtstag
    
    // Osterdatum berechnen (vereinfacht)
    const easter = new Date(year, 2, 21 + ((year % 19) * 11 % 30))
    holidays.push(new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000)) // Karfreitag
    holidays.push(new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000)) // Ostermontag
    
    return holidays
  }, [currentMonth])

  // Hilfsfunktionen
  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      holiday.toDateString() === date.toDateString()
    )
  }

  const hasVacationOnDay = (employeeId: number, date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const employeeKey = employeeId.toString()
    return vacationDaysMap.get(employeeKey)?.has(dateStr) || false
  }

  const hasRejectedVacationOnDay = (employeeId: number, date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const employeeKey = employeeId.toString()
    return rejectedVacationDaysMap.get(employeeKey)?.has(dateStr) || false
  }

  const getVacationStatusOnDay = (employeeId: number, date: Date): 'pending' | 'approved' | null => {
    // Finde alle Urlaube für diesen Mitarbeiter an diesem Tag
    const urlaubeForDay = filteredUrlaube.filter(urlaub => {
      if (urlaub.mitarbeiterId !== employeeId) return false
      if (urlaub.status === 'rejected') return false
      
      const startDate = new Date(urlaub.startDatum)
      const endDate = new Date(urlaub.endDatum)
      const checkDate = new Date(date)
      
      // Setze alle Zeiten auf 00:00:00 für korrekte Datumsvergleiche
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      checkDate.setHours(0, 0, 0, 0)
      
      return checkDate >= startDate && checkDate <= endDate
    })
    
    // Wenn mehrere Urlaube gefunden werden, nehme den mit der höchsten Priorität
    // Priorität: approved > pending
    if (urlaubeForDay.length === 0) return null
    
    const approvedUrlaub = urlaubeForDay.find(u => u.status === 'approved')
    if (approvedUrlaub) return 'approved'
    
    const pendingUrlaub = urlaubeForDay.find(u => u.status === 'pending')
    if (pendingUrlaub) return 'pending'
    
    return null
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentMonth(newDate)
  }

  const toggleEmployeeVisibility = (employeeId: number) => {
    const newVisible = new Set(visibleEmployees)
    if (newVisible.has(employeeId)) {
      newVisible.delete(employeeId)
    } else {
      newVisible.add(employeeId)
    }
    setVisibleEmployees(newVisible)
  }

  // Nur Mitarbeiter der ausgewählten Abteilung standardmäßig sichtbar machen
  useMemo(() => {
    if (filteredEmployees.length > 0 && selectedDepartment) {
      // Nur Mitarbeiter der ausgewählten Abteilung vorauswählen
      const selectedDeptEmployees = filteredEmployees
        .filter(emp => emp.department === selectedDepartment)
        .map(emp => emp.id)
      setVisibleEmployees(new Set(selectedDeptEmployees))
    } else {
      setVisibleEmployees(new Set())
    }
  }, [filteredEmployees, selectedDepartment])

  return {
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
  }
}

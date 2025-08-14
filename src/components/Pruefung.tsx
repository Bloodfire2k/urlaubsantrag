import React, { useState, useEffect, useMemo } from 'react'
import { useYear } from '../contexts/YearContext'
import { useAuth } from '../contexts/AuthContext'

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

interface Market {
  id: number
  name: string
  location: string
}

interface User {
  id: number
  username: string
  fullName: string
  market_id: number
  department: string
  is_active: boolean
}

interface Urlaub {
  id: string
  mitarbeiterId: number
  mitarbeiterName: string
  startDatum: string
  endDatum: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const DEPARTMENTS = ['Markt', 'Bäckerei', 'Metzgerei', 'Kasse'] // Änderung: Korrekte Abteilungsnamen aus den Daten. Grund: Übereinstimmung mit Benutzerdaten

const Pruefung: React.FC = () => {
  const { selectedYear } = useYear()
  const { user } = useAuth()
  
  // Token State für reaktive Updates
  const [token, setToken] = useState<string | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [urlaube, setUrlaube] = useState<Urlaub[]>([])
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedYear, 0, 1)) // Januar des ausgewählten Jahres

  // Token aus localStorage laden und bei Änderungen überwachen
  useEffect(() => {
    const checkToken = () => {
      const storedToken = localStorage.getItem('urlaub_token')
      console.log('🔍 Token Check:', { storedToken: storedToken ? `${storedToken.substring(0, 20)}...` : null, currentToken: token ? `${token.substring(0, 20)}...` : null })
      console.log('🔍 Token Length:', { storedLength: storedToken?.length, currentLength: token?.length })
      setToken(storedToken)
    }
    
    // Initial check
    checkToken()
    
    // Storage events überwachen (für Tab-Synchronisation)
    window.addEventListener('storage', checkToken)
    
    // Cleanup
    return () => window.removeEventListener('storage', checkToken)
  }, [user]) // Neu prüfen wenn sich User ändert

  // Jahr-Änderung verfolgen und Monat zurücksetzen
  useEffect(() => {
    setCurrentMonth(new Date(selectedYear, 0, 1)) // Zurück zu Januar des neuen Jahres
  }, [selectedYear])
  const [visibleEmployees, setVisibleEmployees] = useState<Set<number>>(new Set())

  // Daten laden mit Rate Limiting Schutz
  useEffect(() => {
    let isMounted = true // Verhindere State Updates nach Unmount
    
    const loadData = async () => {
      if (!token || !user) {
        console.log('⚠️ Kein Token oder User vorhanden, warte auf Authentifizierung...', { token: !!token, user: !!user })
        if (isMounted) setLoading(false)
        return
      }
      
      // Änderung: Entfernung des Rate Limiting - echte API-Calls ohne künstliche Verzögerung. Grund: Produktionsreife Lösung
      
      try {
        if (isMounted) setLoading(true)
        console.log('🔐 Token und User vorhanden, lade Daten...', { userId: user.id, role: user.role })
        
        // Märkte laden
        try {
          console.log('🔗 Markets API Call:', { url: `${API_BASE_URL}/markets`, token: token ? `${token.substring(0, 20)}...` : null })
          const marketsResponse = await fetch(`${API_BASE_URL}/markets`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (marketsResponse.ok) {
            const marketsData = await marketsResponse.json()
            // Märkte aus API-Response extrahieren
            const marketsArray = marketsData.markets || []
            setMarkets(Array.isArray(marketsArray) ? marketsArray : [])
          } else {
            console.error('Markets API error:', marketsResponse.status)
            // Änderung: Keine Fallback-Märkte - echte API-Fehlerbehandlung. Grund: Produktionsreife Lösung
            if (isMounted) setMarkets([])
          }
        } catch (error) {
          console.error('Fehler beim Laden der Märkte:', error)
          // Änderung: Keine Fallback-Märkte bei Netzwerkfehlern. Grund: Produktionsreife Lösung
          if (isMounted) setMarkets([])
        }
        
        // Benutzer laden
        try {
          const usersResponse = await fetch(`${API_BASE_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            // Benutzer aus API-Response extrahieren und nur aktive Benutzer verwenden
            const usersArray = usersData.users || []
            const activeUsers = Array.isArray(usersArray) ? usersArray.filter((user: User) => user.is_active) : []
            setUsers(activeUsers)
          } else {
            console.error('Users API error:', usersResponse.status)
            // Änderung: Keine Fallback-Benutzer - echte API-Fehlerbehandlung. Grund: Produktionsreife Lösung
            if (isMounted) setUsers([])
          }
        } catch (error) {
          console.error('Fehler beim Laden der Benutzer:', error)
          // Änderung: Keine Fallback-Benutzer bei Netzwerkfehlern. Grund: Produktionsreife Lösung
          if (isMounted) setUsers([])
        }
        
        // Urlaubsdaten laden
        try {
          console.log(`🔄 Lade Urlaubsdaten für Jahr ${selectedYear}`)
          console.log(`🔗 API URL: ${API_BASE_URL}/urlaub?jahr=${selectedYear}`)
          
          const urlaubeResponse = await fetch(`${API_BASE_URL}/urlaub?jahr=${selectedYear}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          console.log(`📡 Response Status: ${urlaubeResponse.status}`)
          
          if (urlaubeResponse.ok) {
            const urlaubeData = await urlaubeResponse.json()
            // Urlaubsanträge aus API-Response extrahieren
            const urlaubeArray = urlaubeData.urlaubAntraege || []
            
            // Änderung: Alle Urlaubsanträge laden - Filterung erfolgt später über filteredUrlaube. Grund: Saubere Trennung von Datenladung und Filterlogik
            setUrlaube(Array.isArray(urlaubeArray) ? urlaubeArray : [])
          } else {
            console.error('❌ Urlaube API error:', urlaubeResponse.status)
            // Änderung: Keine Fallback-Daten mehr - echte API-Fehlerbehandlung. Grund: Produktionsreife Lösung ohne Platzhalter
            if (isMounted) setUrlaube([])
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden der Urlaubsdaten:', error)
          // Änderung: Keine Fallback-Daten bei Netzwerkfehlern - echte Fehlerbehandlung. Grund: Produktionsreife Lösung
          if (isMounted) setUrlaube([])
        }
        
      } catch (error) {
        console.error('Allgemeiner Fehler beim Laden der Daten:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    loadData()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [selectedYear, token, user])

  // Gefilterte Mitarbeiter basierend auf Markt und Abteilung
  const filteredEmployees = users.filter(user => 
    selectedMarket && user.market_id === selectedMarket &&
    selectedDepartment && user.department === selectedDepartment
  )

  // Debug-Logging wird später hinzugefügt, nachdem filteredUrlaube definiert ist

  // Alle gefilterten Mitarbeiter standardmäßig sichtbar machen
  useEffect(() => {
    if (filteredEmployees.length > 0) {
      setVisibleEmployees(new Set(filteredEmployees.map(emp => emp.id)))
    } else {
      setVisibleEmployees(new Set())
    }
  }, [filteredEmployees])

  // Änderung: Gefilterte Urlaubsanträge - nur von den aktuell gefilterten und sichtbaren Mitarbeitern. Grund: Nur relevante Urlaubsdaten anzeigen
  const filteredUrlaube = useMemo(() => {
    if (!selectedMarket || !selectedDepartment || filteredEmployees.length === 0) {
      return []
    }
    
    // Nur Urlaubsanträge von den gefilterten Mitarbeitern
    const filteredEmployeeIds = filteredEmployees.map(emp => emp.id)
    const relevantUrlaube = urlaube.filter(urlaubsantrag => 
      filteredEmployeeIds.includes(urlaubsantrag.mitarbeiterId)
    )
    
    // Debug: Gefilterte Urlaubsanträge
    if (relevantUrlaube.length > 0) {
      console.log(`🎯 ${relevantUrlaube.length} Urlaubsanträge für ${filteredEmployeeIds.length} Mitarbeiter`)
    }
    
    return relevantUrlaube
  }, [urlaube, filteredEmployees, selectedMarket, selectedDepartment])

  // Debug-Logging nach filteredUrlaube-Definition
  useEffect(() => {
    if (selectedMarket && selectedDepartment) {
      console.log(`📋 Prüfung: ${markets.find(m => m.id === selectedMarket)?.name} - ${selectedDepartment}`)
      console.log(`👥 Gefilterte Mitarbeiter: ${filteredEmployees.length}`)
      console.log(`🏖️ Relevante Urlaubsanträge: ${filteredUrlaube.length}`)
    }
  }, [selectedMarket, selectedDepartment, filteredEmployees, filteredUrlaube, markets])

  // Monatsdaten generieren - alle Tage des aktuellen Monats
  const generateMonthDays = () => {
    const days = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  // Deutsche Feiertage für das ausgewählte Jahr
  const getGermanHolidays = (year: number) => {
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
  }

  const holidays = getGermanHolidays(selectedYear)

  // Prüfen ob ein Datum ein Feiertag ist
  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      holiday.toDateString() === date.toDateString()
    )
  }

  const monthDays = generateMonthDays()

  // Alle Urlaubstage für die GEFILTERTEN Mitarbeiter vorberechnen
  const vacationDaysMap = useMemo(() => {
    const map = new Map<string, Set<string>>() // employeeId -> Set of vacation dates (YYYY-MM-DD)
    
    // Urlaubstage-Map für gefilterte Mitarbeiter berechnen
    
    filteredUrlaube.forEach(urlaub => {
      if (urlaub.status === 'rejected') return // Abgelehnte Anträge ignorieren
      
      const employeeKey = urlaub.mitarbeiterId.toString()
      if (!map.has(employeeKey)) {
        map.set(employeeKey, new Set())
      }
      
      // Alle Tage zwischen Start und End hinzufügen
      const startDate = new Date(urlaub.startDatum)
      const endDate = new Date(urlaub.endDatum)
      const currentDate = new Date(startDate)
      
      console.log(`👤 Mitarbeiter ${urlaub.mitarbeiterId}: ${urlaub.startDatum} bis ${urlaub.endDatum}`)
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        map.get(employeeKey)!.add(dateStr)
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })
    
    return map
  }, [filteredUrlaube, filteredEmployees])

  // Einfache Prüfung ob ein Mitarbeiter an einem bestimmten Tag Urlaub hat
  const hasVacationOnDay = (employeeId: number, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const employeeKey = employeeId.toString()
    return vacationDaysMap.get(employeeKey)?.has(dateStr) || false
  }

  // Monat navigieren
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentMonth(newDate)
  }

  // Mitarbeiter-Sichtbarkeit umschalten
  const toggleEmployeeVisibility = (employeeId: number) => {
    const newVisible = new Set(visibleEmployees)
    if (newVisible.has(employeeId)) {
      newVisible.delete(employeeId)
    } else {
      newVisible.add(employeeId)
    }
    setVisibleEmployees(newVisible)
  }

  // Zeige Loading nur wenn wirklich geladen wird
  if (loading && token && user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Debug: Prüfe Authentifizierung
  console.log('🔍 Auth Debug:', { token: !!token, user: !!user, loading })
  
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
            <p className="text-xs text-base-content/50 mt-2">Debug: Token={!!token}, User={!!user}</p>
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

      {/* Filter-Auswahl */}
      <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Filter auswählen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Markt auswählen */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Markt auswählen</span>
              </label>
              <select 
                className="select select-bordered w-full"
                value={selectedMarket || ''}
                onChange={(e) => {
                  console.log('🎯 Markt geändert:', e.target.value)
                  setSelectedMarket(e.target.value ? Number(e.target.value) : null)
                  setSelectedDepartment('') // Reset department
                }}
              >
                <option value="">-- Markt wählen --</option>
                {markets.map(market => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}

                {/* Änderung: Entfernung der Debug-Informationen. Grund: Produktionsreife Lösung ohne Entwicklungs-Artefakte */}
                {markets.length === 0 && (
                  <option disabled>Keine Märkte verfügbar</option>
                )}
              </select>
            </div>

            {/* Abteilung auswählen */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Abteilung auswählen</span>
              </label>
              <select 
                className="select select-bordered w-full"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedMarket}
              >
                <option value="">-- Abteilung wählen --</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>


      
      {/* Urlaubskalender */}
      {selectedMarket && selectedDepartment && filteredEmployees.length > 0 && (
        <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h2 className="card-title text-xl">
                Urlaubsübersicht: {markets.find(m => m.id === selectedMarket)?.name} - {selectedDepartment}
              </h2>
              
              {/* Monatsnavigation - Pfeile fixiert */}
              <div className="flex items-center justify-center gap-4">
                <button 
                  className="btn btn-outline btn-sm flex-shrink-0"
                  onClick={() => navigateMonth('prev')}
                >
                  ←
                </button>
                <span className="text-sm font-medium text-center min-w-[140px]">
                  {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  className="btn btn-outline btn-sm flex-shrink-0"
                  onClick={() => navigateMonth('next')}
                >
                  →
                </button>
              </div>
            </div>

            {/* Mitarbeiter-Checkboxen */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Mitarbeiter ein-/ausblenden:</h3>
              <div className="flex flex-wrap gap-2">
                {filteredEmployees.map(employee => (
                  <label key={employee.id} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={visibleEmployees.has(employee.id)}
                      onChange={() => toggleEmployeeVisibility(employee.id)}
                    />
                    <span className="text-sm">{employee.fullName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Kalender-Tabelle - Excel-ähnliches Design */}
            <div className="overflow-x-auto">
              <table className="table-fixed border-collapse border border-gray-400 w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="w-48 border border-gray-400 p-2 text-left font-bold">Name</th>
                    {monthDays.map(day => (
                      <th key={day.toISOString()} className="text-center min-w-12 border border-gray-400 p-1">
                        <div className="text-xs font-bold">
                          {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                        </div>
                        <div className="text-xs">
                          {day.getDate()}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees
                    .filter(employee => visibleEmployees.has(employee.id))
                    .map(employee => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="border border-gray-400 p-2 font-medium bg-gray-50">{employee.fullName}</td>
                      {monthDays.map(day => {
                        const isSunday = day.getDay() === 0 // Nur Sonntag ist Wochenende
                        const isHolidayDay = isHoliday(day)
                        const hasVacation = hasVacationOnDay(employee.id, day)
                        
                        let cellClass = 'text-center p-0 border border-gray-300'
                        let bgColor = ''
                        let textColor = 'black'
                        let cellContent = ''
                        
                        if (hasVacation) {
                          bgColor = 'bg-green-400'
                          textColor = 'white'
                          cellContent = ''
                        } else if (isHolidayDay) {
                          bgColor = 'bg-orange-300'
                          textColor = 'black'
                          cellContent = 'F'
                        } else if (isSunday) {
                          bgColor = 'bg-gray-300'
                          textColor = 'black'
                          cellContent = ''
                        } else {
                          bgColor = 'bg-white'
                          textColor = 'black'
                          cellContent = ''
                        }
                        
                        return (
                          <td key={day.toISOString()} className={`${cellClass} ${bgColor}`}>
                            <div 
                              className={`w-full h-8 flex items-center justify-center text-xs font-bold text-${textColor}`}
                              title={
                                hasVacation 
                                  ? 'Urlaub' 
                                  : isHolidayDay
                                    ? 'Feiertag'
                                    : isSunday 
                                      ? 'Sonntag' 
                                      : 'Arbeitszeit'
                              }
                            >
                              {cellContent}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legende */}
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 border border-gray-400"></div>
                <span>Urlaub</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-300 border border-gray-400 flex items-center justify-center text-xs font-bold">F</div>
                <span>Feiertag</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 border border-gray-400"></div>
                <span>Sonntag</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-400"></div>
                <span>Arbeitszeit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keine Mitarbeiter gefunden */}
      {selectedMarket && selectedDepartment && filteredEmployees.length === 0 && (
        <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-lg font-semibold">Keine Mitarbeiter gefunden</p>
            <p className="text-base-content/60">
              In der ausgewählten Abteilung sind keine aktiven Mitarbeiter vorhanden.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pruefung

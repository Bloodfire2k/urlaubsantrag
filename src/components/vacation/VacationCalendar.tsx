import React from 'react'
import { User, Market } from '../../types/vacation'

// Hilfsfunktion zur Berechnung der Kalenderwoche
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

interface VacationCalendarProps {
  markets: Market[]
  selectedMarket: number | null
  selectedDepartment: string
  filteredEmployees: User[]
  visibleEmployees: Set<number>
  currentMonth: Date
  monthDays: Date[]
  isHoliday: (date: Date) => boolean
  hasVacationOnDay: (employeeId: number, date: Date) => boolean
  hasRejectedVacationOnDay: (employeeId: number, date: Date) => boolean
  getVacationStatusOnDay: (employeeId: number, date: Date) => 'pending' | 'approved' | null
  navigateMonth: (direction: 'prev' | 'next') => void
  toggleEmployeeVisibility: (employeeId: number) => void
  handleEmployeeClick?: (employeeId: number) => void
}

export const VacationCalendar: React.FC<VacationCalendarProps> = ({
  markets,
  selectedMarket,
  selectedDepartment,
  filteredEmployees,
  visibleEmployees,
  currentMonth,
  monthDays,
  isHoliday,
  hasVacationOnDay,
  hasRejectedVacationOnDay,
  getVacationStatusOnDay,
  navigateMonth,
  toggleEmployeeVisibility,
  handleEmployeeClick
}) => {
  if (!selectedMarket || !selectedDepartment || filteredEmployees.length === 0) {
    return null
  }

  return (
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

        {/* Mitarbeiter-Checkboxen gruppiert nach Abteilungen */}
        <div className="mb-4 space-y-4">
          <h3 className="text-sm font-semibold">Mitarbeiter ein-/ausblenden:</h3>
          {/* Zuerst die ausgewählte Abteilung */}
          {selectedDepartment && (
            <div className="border-l-4 pl-3 border-emerald-500 mb-6">
              <h4 className="text-sm font-medium mb-2">{selectedDepartment}</h4>
              <div className="flex flex-wrap gap-2">
                {filteredEmployees
                  .filter(emp => emp.department === selectedDepartment)
                  .sort((a, b) => {
                    // Nimm den letzten Teil des Namens als Nachnamen
                    const aLastName = a.fullName.split(' ').pop() || ''
                    const bLastName = b.fullName.split(' ').pop() || ''
                    return aLastName.localeCompare(bLastName)
                  })
                  .map(employee => (
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
          )}

          {/* Dann die anderen relevanten Abteilungen */}
          {(() => {
            // Definiere welche Abteilungen zusammen angezeigt werden sollen
            const departmentGroups: { [key: string]: string[] } = {
              'Kasse': ['Markt', 'Bäckerei'],
              'Markt': ['Kasse', 'Bäckerei'],
              'Bäckerei': ['Markt', 'Kasse'],
              'Metzgerei': [] // Metzgerei bleibt alleine
            };

            // Hole die relevanten anderen Abteilungen
            const otherDepts = departmentGroups[selectedDepartment] || [];
            
            if (otherDepts.length === 0) return null;

            return (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-4 text-base-content/70">Weitere verfügbare Mitarbeiter:</h4>
                <div className="space-y-4">
                  {otherDepts.map(dept => {
                    const deptEmployees = filteredEmployees
                      .filter(emp => emp.department === dept)
                      .sort((a, b) => {
                        // Nimm den letzten Teil des Namens als Nachnamen
                        const aLastName = a.fullName.split(' ').pop() || ''
                        const bLastName = b.fullName.split(' ').pop() || ''
                        return aLastName.localeCompare(bLastName)
                      });

                    if (deptEmployees.length === 0) return null;
                    
                    return (
                      <div key={dept} className="border-l-4 pl-3 border-gray-200">
                        <h4 className="text-sm font-medium mb-2">{dept}</h4>
                        <div className="flex flex-wrap gap-2">
                          {deptEmployees.map(employee => (
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
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Kalender-Tabelle - Excel-ähnliches Design */}
        <div className="overflow-x-auto">
          <table className="table-fixed border-collapse border border-gray-400 w-full">
            <thead>
                            {/* Neue Zeile für Kalenderwochen */}
              <tr className="bg-gray-50">
                <th className="w-48 border border-gray-400 p-1"></th>
                {monthDays.map((day, index) => {
                  // Zeige KW nur am ersten Tag jeder Woche
                  const showKW = index === 0 || day.getDay() === 1;
                  const weekNumber = getWeekNumber(day);
                  // Berechne, wie viele Tage bis zum nächsten Montag (oder Monatsende)
                  const daysUntilNextWeek = monthDays
                    .slice(index)
                    .findIndex((d, i) => i > 0 && d.getDay() === 1);
                  const colSpan = daysUntilNextWeek > 0 ? daysUntilNextWeek : monthDays.length - index;
                  
                  // Prüfe ob die Woche in den Ferienzeiten liegt
                  const vacationPeriods = JSON.parse(localStorage.getItem(`vacation_periods_${currentMonth.getFullYear()}`) || '[]');
                  const isVacationWeek = vacationPeriods.some((period: any) => 
                    weekNumber >= period.startWeek && weekNumber <= period.endWeek
                  );
                  
                  return showKW ? (
                    <th 
                      key={day.toISOString()} 
                      colSpan={colSpan}
                      className={`text-center border border-gray-400 p-1 text-xs h-8 ${
                        isVacationWeek ? 'bg-orange-100 text-orange-800 font-medium' : 'text-gray-500'
                      }`}
                      title={isVacationWeek ? 'Ferienzeit' : undefined}
                    >
                      <div className="h-full flex items-center justify-center">
                        KW {weekNumber}
                      </div>
                    </th>
                  ) : null;
                })}
              </tr>
              {/* Zeile für Wochentage und Datum */}
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
                .sort((a, b) => {
                  // Erst nach Abteilung (ausgewählte zuerst), dann nach Nachname
                  if (a.department === selectedDepartment && b.department !== selectedDepartment) return -1;
                  if (a.department !== selectedDepartment && b.department === selectedDepartment) return 1;
                  // Nimm den letzten Teil des Namens als Nachnamen
                  const aLastName = a.fullName.split(' ').pop() || ''
                  const bLastName = b.fullName.split(' ').pop() || ''
                  return aLastName.localeCompare(bLastName);
                })
                .map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td 
                    className="border border-gray-400 p-2 font-medium bg-gray-50 cursor-pointer hover:bg-blue-50"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleEmployeeClick?.(employee.id)
                    }}
                  >
                    {employee.fullName}
                  </td>
                  {monthDays.map(day => {
                    const isSunday = day.getDay() === 0 // Nur Sonntag ist Wochenende
                    const isHolidayDay = isHoliday(day)
                    const hasVacation = hasVacationOnDay(employee.id, day)
                    const hasRejectedVacation = hasRejectedVacationOnDay(employee.id, day)
                    const vacationStatus = getVacationStatusOnDay(employee.id, day)
                    
                    let cellClass = 'text-center p-0 border border-gray-300'
                    let bgColor = ''
                    let textColor = 'black'
                    let cellContent = ''
                    let additionalStyles = ''
                    
                    // Zuerst Feiertage und Sonntage prüfen (haben Vorrang)
                    if (isHolidayDay) {
                      bgColor = 'bg-orange-300'
                      textColor = 'black'
                      cellContent = 'F'
                    } else if (isSunday) {
                      bgColor = 'bg-gray-200'
                      textColor = 'black'
                      cellContent = ''
                    }
                    // Dann abgelehnte Urlaube (rot mit Durchstreichung)
                    else if (hasRejectedVacation) {
                      bgColor = 'bg-red-400'
                      textColor = 'white'
                      cellContent = ''
                      additionalStyles = 'line-through decoration-2 decoration-white'
                    }
                    // Dann Urlaube nach Status unterscheiden
                    else if (hasVacation) {
                      if (vacationStatus === 'approved') {
                        bgColor = 'bg-green-400'
                        textColor = 'white'
                        cellContent = ''
                      } else if (vacationStatus === 'pending') {
                        bgColor = 'bg-orange-400'
                        textColor = 'white'
                        cellContent = ''
                      } else {
                        // Fallback für unbekannten Status
                        bgColor = 'bg-green-400'
                        textColor = 'white'
                        cellContent = ''
                      }
                    } else {
                      bgColor = 'bg-white'
                      textColor = 'black'
                      cellContent = ''
                    }
                    
                    return (
                      <td key={day.toISOString()} className={`${cellClass} ${bgColor}`}>
                        <div 
                          className={`w-full h-8 flex items-center justify-center text-xs font-bold text-${textColor} ${additionalStyles}`}
                          title={
                            hasRejectedVacation
                              ? 'Abgelehnter Urlaub'
                              : hasVacation 
                              ? (vacationStatus === 'approved' ? 'Genehmigter Urlaub' : 'Ausstehender Urlaub')
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

        {/* Wöchentliche Auswertung */}
        <div className="mt-8 border-t pt-4">
          <h3 className="text-sm font-semibold mb-4">Wöchentliche Urlaubsübersicht:</h3>
          <div className="overflow-x-auto">
            <table className="table-fixed border-collapse border border-gray-400 w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left font-bold">Kalenderwoche</th>
                  <th className="border border-gray-400 p-2 text-center font-bold">Mitarbeiter im Urlaub</th>
                  <th className="border border-gray-400 p-2 text-left font-bold">Details</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Gruppiere Tage nach Kalenderwochen
                  const weekMap = new Map<number, Date[]>();
                  monthDays.forEach(day => {
                    const week = getWeekNumber(day);
                    if (!weekMap.has(week)) {
                      weekMap.set(week, []);
                    }
                    weekMap.get(week)?.push(day);
                  });

                  // Für jede Woche die Urlauber zählen
                  return Array.from(weekMap.entries()).map(([weekNum, days]) => {
                    const employeesOnVacation = new Map<number, string>();
                    
                    days.forEach(day => {
                      if (!isHoliday(day) && day.getDay() !== 0) { // Keine Feiertage und Sonntage
                        filteredEmployees
                          .filter(emp => visibleEmployees.has(emp.id))
                          .forEach(emp => {
                            // Nur genehmigte/pending Urlaube zählen, keine abgelehnten
                            if (hasVacationOnDay(emp.id, day) && !hasRejectedVacationOnDay(emp.id, day)) {
                              employeesOnVacation.set(emp.id, emp.fullName);
                            }
                          });
                      }
                    });

                    const count = employeesOnVacation.size;
                    const names = Array.from(employeesOnVacation.values()).join(', ');
                    
                    // Warnschwelle je nach Abteilung
                    const getWarningThreshold = (dept: string) => {
                      switch (dept) {
                        case 'Kasse': return 2;
                        case 'Markt': return 5;
                        case 'Bäckerei': return 1;
                        default: return 2;
                      }
                    };

                    const threshold = getWarningThreshold(selectedDepartment);
                    const isOverThreshold = count > threshold;

                    return (
                      <tr key={weekNum} className={isOverThreshold ? 'bg-yellow-50' : ''}>
                        <td className="border border-gray-400 p-2">KW {weekNum}</td>
                        <td className={`border border-gray-400 p-2 text-center font-medium ${isOverThreshold ? 'text-orange-600' : ''}`}>
                          {count}
                        </td>
                        <td className="border border-gray-400 p-2 text-sm">
                          {names}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legende */}
        <div className="flex justify-center gap-6 mt-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 border border-gray-400"></div>
            <span>Genehmigter Urlaub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 border border-gray-400"></div>
            <span>Ausstehender Urlaub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 border border-gray-400 flex items-center justify-center">
              <div className="w-full h-0.5 bg-white"></div>
            </div>
            <span>Abgelehnt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-300 border border-gray-400 flex items-center justify-center text-xs font-bold">F</div>
            <span>Feiertag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-400"></div>
            <span>Sonntag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-400"></div>
            <span>Arbeitszeit</span>
          </div>
        </div>
      </div>
    </div>
  )
}

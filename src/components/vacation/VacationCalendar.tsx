import React from 'react'
import { User, Market } from '../../types/vacation'

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
  navigateMonth: (direction: 'prev' | 'next') => void
  toggleEmployeeVisibility: (employeeId: number) => void
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
  navigateMonth,
  toggleEmployeeVisibility
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
  )
}

import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface VacationPeriod {
  id: number
  name: string
  startWeek: number
  endWeek: number
  year: number
}

interface VacationPeriodsProps {
  year: number
}

export const VacationPeriods: React.FC<VacationPeriodsProps> = ({ year }) => {
  const [periods, setPeriods] = useState<VacationPeriod[]>(() => {
    // Lade gespeicherte Ferien aus dem localStorage
    const saved = localStorage.getItem(`vacation_periods_${year}`)
    return saved ? JSON.parse(saved) : []
  })

  const [newPeriod, setNewPeriod] = useState({
    name: '',
    startWeek: 1,
    endWeek: 1
  })

  // Speichere Änderungen im localStorage
  useEffect(() => {
    localStorage.setItem(`vacation_periods_${year}`, JSON.stringify(periods))
  }, [periods, year])

  const handleAddPeriod = () => {
    if (newPeriod.name && newPeriod.startWeek <= newPeriod.endWeek) {
      setPeriods(prev => [...prev, {
        id: Date.now(),
        year,
        ...newPeriod
      }])
      setNewPeriod({ name: '', startWeek: 1, endWeek: 1 })
    }
  }

  const handleDeletePeriod = (id: number) => {
    setPeriods(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="card bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-amber-500">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-amber-800">Ferienzeiten {year}</h3>
            <p className="text-amber-700">Verwalten Sie die Ferienwochen</p>
          </div>
        </div>

        {/* Eingabeformular */}
        <div className="bg-white p-4 rounded-lg border border-yellow-200 mb-4">
          {/* Beschriftungsfeld */}
          <div className="mb-4">
            <div className="font-medium mb-1">Bezeichnung der Ferienzeit:</div>
            <input
              type="text"
              placeholder="z.B. Sommerferien, Herbstferien, etc."
              className="input input-bordered w-full bg-white"
              value={newPeriod.name}
              onChange={e => setNewPeriod(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* KW-Auswahl */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="font-medium mb-1">Von Kalenderwoche:</div>
              <select
                className="select select-bordered w-full bg-white"
                value={newPeriod.startWeek}
                onChange={e => setNewPeriod(prev => ({ ...prev, startWeek: parseInt(e.target.value) }))}
              >
                {Array.from({ length: 53 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>KW {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="font-medium mb-1">Bis Kalenderwoche:</div>
              <select
                className="select select-bordered w-full bg-white"
                value={newPeriod.endWeek}
                onChange={e => setNewPeriod(prev => ({ ...prev, endWeek: parseInt(e.target.value) }))}
              >
                {Array.from({ length: 53 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>KW {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            className="btn btn-primary w-full bg-indigo-500 hover:bg-indigo-600 border-0"
            onClick={handleAddPeriod}
            disabled={!newPeriod.name || newPeriod.startWeek > newPeriod.endWeek}
          >
            Ferienzeit hinzufügen
          </button>
        </div>

        {/* Liste der Ferienzeiten */}
        <div className="space-y-2">
          {periods.length === 0 ? (
            <div className="text-center py-4 text-yellow-700">
              Keine Ferienzeiten eingetragen
            </div>
          ) : (
            periods.map(period => (
              <div key={period.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                <div>
                  <span className="font-medium">{period.name}</span>
                  <span className="text-gray-500 ml-2">
                    (KW {period.startWeek} - KW {period.endWeek})
                  </span>
                </div>
                <button 
                  className="btn btn-ghost btn-sm text-red-500"
                  onClick={() => handleDeletePeriod(period.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-600 mt-4">
          <Calendar className="w-5 h-5" />
          <span>Die Ferienwochen werden im Kalender farblich hervorgehoben.</span>
        </div>
      </div>
    </div>
  )
}

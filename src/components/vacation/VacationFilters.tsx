import React from 'react'
import { Market, DEPARTMENTS } from '../../types/vacation'

interface VacationFiltersProps {
  markets: Market[]
  selectedMarket: number | null
  selectedDepartment: string
  onMarketChange: (marketId: number | null) => void
  onDepartmentChange: (department: string) => void
}

export const VacationFilters: React.FC<VacationFiltersProps> = ({
  markets,
  selectedMarket,
  selectedDepartment,
  onMarketChange,
  onDepartmentChange
}) => {
  return (
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
                const value = e.target.value ? Number(e.target.value) : null
                onMarketChange(value)
              }}
            >
              <option value="">-- Markt wählen --</option>
              {markets.map(market => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
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
              onChange={(e) => onDepartmentChange(e.target.value)}
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
  )
}

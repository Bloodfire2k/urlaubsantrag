import React from 'react'

interface NoEmployeesFoundProps {
  selectedMarket: number | null
  selectedDepartment: string
}

export const NoEmployeesFound: React.FC<NoEmployeesFoundProps> = ({
  selectedMarket,
  selectedDepartment
}) => {
  if (!selectedMarket || !selectedDepartment) {
    return null
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
      <div className="card-body text-center py-12">
        <div className="text-4xl mb-4">👥</div>
        <p className="text-lg font-semibold">Keine Mitarbeiter gefunden</p>
        <p className="text-base-content/60">
          In der ausgewählten Abteilung sind keine aktiven Mitarbeiter vorhanden.
        </p>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useYear } from '../contexts/YearContext'
import { Calendar, User, AlertTriangle } from 'lucide-react'
import { isDateRangeBlocked, getBlockedPeriodsForDisplay } from '../utils/vacationBlocks'

interface UrlaubFormProps {
  onSubmit: (urlaub: { mitarbeiterName: string; startDatum: string; endDatum: string }) => void
  existingUrlaube?: { startDatum: string; endDatum: string; status: string }[]
}

const UrlaubForm: React.FC<UrlaubFormProps> = ({ onSubmit, existingUrlaube = [] }) => {
  const { user } = useAuth()
  const { selectedYear } = useYear()
  const [startDatum, setStartDatum] = useState('')
  const [endDatum, setEndDatum] = useState('')
  const [showBlockedPeriods, setShowBlockedPeriods] = useState(false)
  
  const blockedPeriods = getBlockedPeriodsForDisplay(selectedYear)
  
  // Automatisch Enddatum setzen wenn Startdatum geändert wird
  const handleStartDatumChange = (value: string) => {
    setStartDatum(value)
    // Wenn Enddatum leer ist oder vor dem neuen Startdatum liegt, setze es auf Startdatum
    if (!endDatum || new Date(endDatum) < new Date(value)) {
      setEndDatum(value)
    }
  }


  // Prüfung auf Überlappungen
  const checkForOverlap = (newStart: string, newEnd: string): string | null => {
    const newStartDate = new Date(newStart)
    const newEndDate = new Date(newEnd)
    
    for (const urlaub of existingUrlaube) {
      // Nur genehmigte oder ausstehende Anträge prüfen
      if (urlaub.status === 'rejected') continue
      
      const existingStart = new Date(urlaub.startDatum)
      const existingEnd = new Date(urlaub.endDatum)
      
      // Überlappung prüfen
      if (newStartDate <= existingEnd && newEndDate >= existingStart) {
        const formatDate = (date: Date) => date.toLocaleDateString('de-DE')
        return `⚠️ Überlappung erkannt!\n\nSie haben bereits Urlaub vom ${formatDate(existingStart)} bis ${formatDate(existingEnd)} beantragt.\n\nBitte wählen Sie einen anderen Zeitraum.`
      }
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!startDatum || !endDatum) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    const startDate = new Date(startDatum)
    const endDate = new Date(endDatum)
    
    if (startDate > endDate) {
      alert('Das Startdatum muss vor dem Enddatum liegen.')
      return
    }

    // Überlappungsprüfung
    const overlapMessage = checkForOverlap(startDatum, endDatum)
    if (overlapMessage) {
      alert(overlapMessage)
      return
    }

    // Urlaubssperre prüfen
    const blockCheck = isDateRangeBlocked(startDate, endDate, selectedYear)
    if (blockCheck.blocked) {
      alert(`❌ Urlaubssperre!\n\n${blockCheck.reason}\n\nUrlaub in diesem Zeitraum ist nicht möglich.`)
      return
    }

    onSubmit({
      mitarbeiterName: user?.fullName || '',
      startDatum,
      endDatum
    })

    // Formular zurücksetzen
    setStartDatum('')
    setEndDatum('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Mitarbeiter Name (vorausgefüllt und deaktiviert) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            Mitarbeiter
          </label>
          <label className="input-modern input-bordered rounded-2xl flex items-center gap-2 border-base-300 shadow-sm">
            <User className="w-4 h-4 opacity-70" />
            <input
              type="text"
              value={user?.fullName || ''}
              disabled
              className="grow bg-transparent"
            />
          </label>
        </div>

        {/* Start- und Enddatum nebeneinander (kein Rahmen) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDatum" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-2" />
              Startdatum
            </label>
            <label className="input-modern input-bordered rounded-2xl flex items-center gap-2 border-base-300 shadow-sm">
              <Calendar className="w-4 h-4 opacity-70" />
              <input
                id="startDatum"
                type="date"
                value={startDatum}
                onChange={(e) => handleStartDatumChange(e.target.value)}
                min={`${selectedYear}-01-01`}
                max={`${selectedYear}-12-31`}
                required
                className="grow bg-transparent"
              />
            </label>
          </div>
          <div>
            <label htmlFor="endDatum" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-2" />
              Enddatum
            </label>
            <label className="input-modern input-bordered rounded-2xl flex items-center gap-2 border-base-300 shadow-sm">
              <Calendar className="w-4 h-4 opacity-70" />
              <input
                id="endDatum"
                type="date"
                value={endDatum}
                onChange={(e) => setEndDatum(e.target.value)}
                min={`${selectedYear}-01-01`}
                max={`${selectedYear}-12-31`}
                required
                className="grow bg-transparent"
              />
            </label>
          </div>
        </div>



        {/* Submit Button */}
        <button type="submit" className="btn-modern btn-primary-modern w-full btn-md md:btn-lg normal-case">
          Urlaubsantrag einreichen
        </button>
        
        {/* Gesperrte Zeiten anzeigen */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-800">Urlaubssperren {selectedYear}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowBlockedPeriods(!showBlockedPeriods)}
              className="text-orange-600 hover:text-orange-800 text-sm font-medium"
            >
              {showBlockedPeriods ? 'Ausblenden' : 'Anzeigen'}
            </button>
          </div>
          
          {showBlockedPeriods && (
            <div className="mt-3 space-y-2">
              {blockedPeriods.map((period, index) => (
                <div key={index} className="text-sm text-orange-700 bg-orange-100 px-3 py-2 rounded">
                  {period}
                </div>
              ))}
              <div className="text-xs text-orange-600 mt-2">
                ℹ️ In diesen Zeiträumen ist kein Urlaub möglich.
              </div>
            </div>
          )}
        </div>
    </form>
  )
}

export default UrlaubForm

import React from 'react'
import { Calendar, Settings as SettingsIcon, Clock, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useYear } from '../contexts/YearContext'
import { VacationPeriods } from './admin/settings/VacationPeriods'

const Settings: React.FC = () => {
  const { user } = useAuth()
  const { selectedYear, setSelectedYear } = useYear()

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">⚠️ Keine Berechtigung</div>
        <p className="text-red-700">Sie haben keine Berechtigung, die Einstellungen zu bearbeiten.</p>
      </div>
    )
  }

  return (
    <div className="card-modern bg-base-100 shadow max-w-4xl mx-auto">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '28px', marginBottom: '8px' }}>
              ⚙️ Systemeinstellungen
            </h2>
            <p className="text-base-content/70">Konfigurieren Sie die globalen Einstellungen des Systems</p>
          </div>
        </div>

        {/* Einstellungen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Jahresauswahl */}
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Urlaubsjahr</h3>
                  <p className="text-blue-700 text-sm">Bestimmt das aktive Jahr für alle Urlaubsanträge</p>
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Aktives Jahr auswählen:</span>
                </label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => {
                    const newYear = parseInt(e.target.value)
                    setSelectedYear(newYear)
                    // Kurze Bestätigung anzeigen
                    const originalText = e.target.parentElement?.querySelector('.year-confirmation')
                    if (!originalText) {
                      const confirmation = document.createElement('div')
                      confirmation.className = 'year-confirmation text-green-600 text-sm font-medium mt-1'
                      confirmation.textContent = `✓ Jahr auf ${newYear} gesetzt`
                      e.target.parentElement?.appendChild(confirmation)
                      setTimeout(() => confirmation.remove(), 2000)
                    }
                  }}
                  className="select select-bordered w-full max-w-xs bg-white"
                >
                  {Array.from({length: 10}, (_, i) => {
                    // Zeige die nächsten 10 Jahre an, beginnend mit dem aktuellen Jahr
                    const year = new Date().getFullYear() + i
                    return (
                      <option key={year} value={year}>{year}</option>
                    )
                  })}
                </select>
                <div className="label">
                  <span className="label-text-alt text-blue-600">
                    📅 Mitarbeiter können nur Urlaub für {selectedYear} beantragen
                  </span>
                </div>
              </div>

              <div className="alert alert-info mt-4">
                <SettingsIcon className="w-4 h-4" />
                <span className="text-sm">
                  Das gewählte Jahr bestimmt die verfügbaren Kalenderdaten für alle Mitarbeiter.
                </span>
              </div>
            </div>
          </div>

          {/* Systeminfo */}
          <div className="card bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Systeminfo</h3>
                  <p className="text-green-700 text-sm">Aktuelle Systemkonfiguration</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Aktives Jahr:</span>
                  <span className="badge badge-success">{selectedYear}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Verfügbare Märkte:</span>
                  <span className="badge badge-success">E-Center, Edeka</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Feiertage:</span>
                  <span className="badge badge-success">Hessen</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Wochenende:</span>
                  <span className="badge badge-success">Sonntag ausgeschlossen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zeitzonen & Kalender */}
          <div className="card bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Kalendereinstellungen</h3>
                  <p className="text-purple-700 text-sm">Zeitzone und Arbeitstage</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-800">Zeitzone:</span>
                  <span className="badge badge-secondary">Europa/Berlin</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-800">Arbeitstage:</span>
                  <span className="badge badge-secondary">Mo-Sa</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-800">Freie Tage:</span>
                  <span className="badge badge-secondary">Sonntag + Feiertage</span>
                </div>
              </div>

              <div className="alert alert-warning mt-4">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Urlaubstage werden automatisch ohne Sonntage und Feiertage berechnet.
                </span>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="card bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Administrator</h3>
                  <p className="text-orange-700 text-sm">Ihre Administratorrechte</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-800">Name:</span>
                  <span className="badge badge-warning">{user.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-800">Rolle:</span>
                  <span className="badge badge-warning">Administrator</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-800">Berechtigungen:</span>
                  <span className="badge badge-warning">Vollzugriff</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ferienzeiten */}
          <VacationPeriods year={selectedYear} />
        </div>

        {/* Info Box */}
        <div className="alert alert-info mt-8">
          <SettingsIcon className="w-5 h-5" />
          <div>
            <h4 className="font-semibold">Wichtige Hinweise:</h4>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Das gewählte Jahr gilt für alle Mitarbeiter systemweit</li>
              <li>• Jahresänderungen werden sofort für alle Benutzer aktiv</li>
              <li>• Feiertage werden automatisch für Hessen berechnet</li>
              <li>• Sonntage werden bei der Urlaubsberechnung nicht mitgezählt</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

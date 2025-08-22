import React from 'react'
import { User, Market, UserFormData } from '../../../types/admin/user'
import { User as UserIcon, Shield, Building, Briefcase, Calendar, Crown, Mail, Lock } from 'lucide-react'

interface UserFormProps {
  userForm: UserFormData
  markets: Market[]
  onNameChange: (field: 'firstName' | 'lastName', value: string) => void
  onFormChange: (updates: Partial<UserFormData>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  mode: 'create' | 'edit'
}

export const UserForm: React.FC<UserFormProps> = ({
  userForm,
  markets,
  onNameChange,
  onFormChange,
  onSubmit,
  onCancel,
  mode
}) => {
  return (
    <form onSubmit={onSubmit}>
      {/* Persönliche Daten */}
      <div className="form-group">
        <label className="form-label">
          <UserIcon size={16} />
          Vorname
        </label>
        <input
          type="text"
          className="input-modern"
          value={userForm.firstName}
          onChange={(e) => onNameChange('firstName', e.target.value)}
          placeholder="z.B. Max"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <UserIcon size={16} />
          Nachname
        </label>
        <input
          type="text"
          className="input-modern"
          value={userForm.lastName}
          onChange={(e) => onNameChange('lastName', e.target.value)}
          placeholder="z.B. Mustermann"
          required
        />
      </div>

      {/* Automatisch generierte Daten */}
      {(userForm.firstName || userForm.lastName) && (
        <div className="bg-slate-50 p-4 rounded-xl mb-5 border border-slate-200">
          <h5 className="font-semibold mb-3 text-slate-700">
            📋 Automatisch generiert:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Vollständiger Name:</span>
              <div className="font-mono bg-white p-2 rounded border border-slate-200 mt-1">
                {userForm.fullName}
              </div>
            </div>
            <div>
              <span className="text-slate-600">Benutzername:</span>
              <div className="font-mono bg-white p-2 rounded border border-slate-200 mt-1">
                {userForm.username}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markt */}
      <div className="form-group">
        <label className="form-label">
          <Building size={16} />
          Markt
        </label>
        <select
          className="input-modern"
          value={userForm.marketId}
          onChange={(e) => onFormChange({...userForm, marketId: parseInt(e.target.value)})}
        >
          {markets.map(market => (
            <option key={market.id} value={market.id}>
              {market.id === 2 ? '🏪' : '🏬'} {market.name}
            </option>
          ))}
        </select>
      </div>

      {/* Abteilung */}
      <div className="form-group">
        <label className="form-label">
          <Briefcase size={16} />
          Abteilung
        </label>
        <select
          className="input-modern"
          value={userForm.department}
          onChange={(e) => onFormChange({...userForm, department: e.target.value})}
          required
        >
          <option value="">Abteilung wählen...</option>
          <option value="Markt">🛒 Markt</option>
          <option value="Kasse">💰 Kasse</option>
          <option value="Bäckerei">🥖 Bäckerei</option>
          <option value="Metzgerei">🥩 Metzgerei</option>
        </select>
      </div>

      {/* Urlaubsanspruch */}
      <div className="form-group">
        <label className="form-label">
          <Calendar size={16} />
          Urlaubsanspruch (Tage/Jahr)
        </label>
        <input
          type="number"
          min="20"
          max="40"
          className="input-modern"
          value={userForm.urlaubsanspruch || ''}
          onChange={(e) => onFormChange({...userForm, urlaubsanspruch: parseInt(e.target.value) || 25})}
          required
        />
      </div>

      {/* Rolle */}
      <div className="form-group">
        <label className="form-label">
          <Crown size={16} />
          Rolle
        </label>
        <select
          className="input-modern"
          value={userForm.role}
          onChange={(e) => onFormChange({...userForm, role: e.target.value as 'admin' | 'manager' | 'employee'})}
        >
          <option value="employee">👤 Mitarbeiter</option>
          <option value="manager">👔 Manager</option>
          <option value="admin">🔧 Admin</option>
        </select>
      </div>

      {/* E-Mail Info */}
      {userForm.username && (
        <div className="bg-blue-50 p-4 rounded-xl mb-5 border border-blue-200">
          <div className="flex items-center mb-2">
            <Mail size={16} className="text-blue-600 mr-2" />
            <h5 className="font-semibold text-blue-900">E-Mail wird automatisch generiert</h5>
          </div>
          <div className="font-mono text-base bg-white p-3 rounded border border-blue-200">
            {userForm.username}@{userForm.marketId === 2 ? 'ecenter' : 'edeka'}.de
          </div>
        </div>
      )}

      {/* Automatisch generiertes Passwort */}
      {mode === 'create' && userForm.password && (
        <div className="bg-amber-50 p-4 rounded-xl mb-5 border border-amber-200">
          <div className="flex items-center mb-2">
            <Lock size={16} className="text-amber-600 mr-2" />
            <h5 className="font-semibold text-amber-900">Automatisch generiertes Passwort:</h5>
          </div>
          <div className="font-mono text-lg font-semibold bg-white p-3 rounded border border-amber-200 mb-2">
            {userForm.password}
          </div>
          <p className="text-sm text-amber-800">
            ⚠️ Bitte notieren Sie sich das Passwort - es wird dem Mitarbeiter mitgeteilt.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          className="btn-modern btn-primary-modern flex-1 flex items-center justify-center gap-2"
        >
          {mode === 'create' ? (
            <>
              <UserIcon size={18} />
              Mitarbeiter erstellen
            </>
          ) : (
            <>
              <Shield size={18} />
              Änderungen speichern
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-modern flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}

import React, { useState } from 'react'
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from './ui/Button'

const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(credentials)
  }

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="card-modern bg-base-100 shadow max-w-3xl mx-auto fade-in-up">
      <div className="card-body">
        <h2 className="card-title justify-center">Anmeldung</h2>
        <p className="text-base-content/70 text-center">Melden Sie sich mit Ihren Zugangsdaten an</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <User size={16} />
            Benutzername
          </label>
          <input
            type="text"
            className="input-modern"
            value={credentials.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="max.mustermann"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Lock size={16} />
            Passwort
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-modern"
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Ihr Passwort"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            color: '#ef4444', 
            backgroundColor: '#fef2f2', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <Button type="submit" disabled={isLoading} fullWidth leftIcon={<LogIn size={18} />} className="btn-modern btn-primary-modern"> 
          {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
        </Button>
      </form>
      <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm">
        <h4 className="mb-3 text-slate-700 font-semibold">Demo-Zugangsdaten:</h4>
        <div className="grid gap-1">
                                                                           <div><strong>Test-Admin:</strong> username: <code>testadmin</code>, password: <code>test</code></div>
          <div><strong>Admin:</strong> username: <code>admin</code>, password: <code>admin</code></div>
          <div><strong>Mitarbeiter:</strong> username: <code>max.mustermann</code>, password: <code>max</code></div>
          <div><strong>Mitarbeiterin:</strong> username: <code>anna.schmidt</code>, password: <code>anna</code></div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default LoginForm

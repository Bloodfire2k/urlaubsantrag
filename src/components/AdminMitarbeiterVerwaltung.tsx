import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Edit, Trash2, Eye, UserPlus, Building, Users, Shield, User, Lock, Mail, MapPin, Briefcase, Calendar, Crown, UserX, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useYear } from '../contexts/YearContext'


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

interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'employee'
  market_id: number
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Market {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
}

interface AdminMitarbeiterVerwaltungProps {
  onClose: () => void
}

const AdminMitarbeiterVerwaltung: React.FC<AdminMitarbeiterVerwaltungProps> = ({ onClose }) => {
  const { user } = useAuth()
  const { selectedYear, setSelectedYear } = useYear()

  const [users, setUsers] = useState<User[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showMarketForm, setShowMarketForm] = useState(false)
  const [editingMarket, setEditingMarket] = useState<Market | null>(null)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  // Toast-Funktion
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log('Toast anzeigen:', message, type)
    setToast({ message, type })
    setTimeout(() => {
      console.log('Toast ausblenden')
      setToast(null)
    }, 5000) // 5 Sekunden anzeigen
  }

  // Formular-Zustände
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    fullName: '',
    password: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    marketId: 2,
    department: '',
    urlaubsanspruch: 36
  })

  // Hilfsfunktion für automatische Benutzername- und Passwort-Generierung
  const generateCredentials = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return { username: '', password: '' }
    
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    const password = generateSimplePassword()
    
    return { username, password }
  }

  // Einfaches Passwort generieren (8 Zeichen, nur Buchstaben)
  const generateSimplePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Namen-Handler mit automatischer Generierung
  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const newForm = { ...userForm, [field]: value }
    
    if (field === 'firstName') newForm.firstName = value
    if (field === 'lastName') newForm.lastName = value
    
    // Vollständigen Namen aktualisieren
    newForm.fullName = `${newForm.firstName} ${newForm.lastName}`.trim()
    
    // Automatisch Benutzername und Passwort generieren
    const credentials = generateCredentials(newForm.firstName, newForm.lastName)
    newForm.username = credentials.username
    newForm.password = credentials.password
    
    setUserForm(newForm)
  }

  const [marketForm, setMarketForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    console.log('useEffect aufgerufen, user role:', user?.role)
    if (user?.role === 'admin') {
      fetchUsers()
      fetchMarkets()
    } else {
      console.log('Kein Admin-Zugriff, setLoading(false)')
      setLoading(false)
    }
  }, [user])

  const fetchUsers = async () => {
    console.log('fetchUsers aufgerufen')
    try {
      const token = localStorage.getItem('urlaub_token')
      if (!token) {
        console.error('Kein Token gefunden')
        return
      }
      console.log('Token gefunden:', token.substring(0, 20) + '...')

      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Response Status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Benutzer geladen:', data.users?.length || 0, 'Benutzer')
        setUsers(data.users || [])
      } else {
        console.error('Fehler beim Laden:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMarkets = async () => {
    try {
      // Fixe Märkte: E-Center und Edeka (mit korrekten IDs aus der Datenbank)
      setMarkets([
        { id: 2, name: 'E-Center', address: '', phone: '', email: '' },
        { id: 3, name: 'Edeka', address: '', phone: '', email: '' }
      ])
    } catch (error) {
      console.error('Fehler beim Laden der Märkte:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('urlaub_token')
      if (!token) {
        alert('Fehler: Kein gültiges Token gefunden. Bitte melden Sie sich neu an.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: userForm.username,
          email: `${userForm.username}@${userForm.marketId === 2 ? 'ecenter' : 'edeka'}.de`,
          fullName: userForm.fullName,
          password: userForm.password,
          role: userForm.role,
          marketId: userForm.marketId,
          department: userForm.department,
          urlaubsanspruch: userForm.urlaubsanspruch
        })
      })

      if (response.ok) {
        const result = await response.json()
        showToast(`✅ Mitarbeiter "${userForm.fullName}" erfolgreich erstellt! Login: ${userForm.username}`, 'success')
        
        // Formular zurücksetzen
        setUserForm({
          firstName: '',
          lastName: '',
          username: '',
          fullName: '',
          password: '',
          role: 'employee',
          marketId: 2,
          department: '',
          urlaubsanspruch: 36
        })
        
        // Automatisches Schließen nach 2 Sekunden (damit Toast sichtbar bleibt)
        setTimeout(() => {
          setShowCreateForm(false)
        }, 2000)
        
        fetchUsers()
      } else {
        const error = await response.json()
        if (response.status === 401 || response.status === 403) {
          showToast(`Authentifizierungsfehler: ${error.error}. Bitte melden Sie sich neu an.`, 'error')
          // KEIN localStorage.removeItem() - das löst Weiterleitungen aus!
          // localStorage.removeItem('urlaub_token')
          // localStorage.removeItem('urlaub_user')
        } else {
          showToast(`Fehler: ${error.error}`, 'error')
        }
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error)
      showToast('Fehler beim Erstellen des Benutzers', 'error')
    }
  }

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    console.log('=== TOGGLE STATUS START ===', userId, isActive)
    const user = users.find(u => u.id === userId)
    if (!user) return

    const action = isActive ? 'deaktivieren' : 'reaktivieren'
    if (!confirm(`Möchten Sie den Mitarbeiter "${user.fullName}" wirklich ${action}?`)) {
      console.log('=== TOGGLE STATUS ABGEBROCHEN ===')
      return
    }
    
    console.log('=== TOGGLE STATUS BESTÄTIGT ===', action)

    try {
      const token = localStorage.getItem('urlaub_token')
      if (!token) {
        alert('Fehler: Kein gültiges Token gefunden. Bitte melden Sie sich neu an.')
        return
      }

      const url = isActive 
        ? `${API_BASE_URL}/users/${userId}`
        : `${API_BASE_URL}/users/${userId}/reactivate`
      
      const method = isActive ? 'DELETE' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        console.log('=== TOGGLE STATUS ERFOLGREICH ===')
        // Keine Erfolgsmeldung - Benutzer sieht es in der Liste
        fetchUsers() // Liste aktualisieren
        console.log('=== FETCHUSERS AUFGERUFEN ===')
      } else {
        console.log('Toggle Status Fehler:', response.status)
        const error = await response.json()
        alert(`Fehler beim ${action}: ${error.error}`)
      }
    } catch (error) {
      console.error(`Fehler beim ${action} des Mitarbeiters:`, error)
      alert(`Fehler beim ${action} des Mitarbeiters`)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!confirm(`Möchten Sie den Mitarbeiter "${user.fullName}" dauerhaft löschen?\n\nDies kann nicht rückgängig gemacht werden!`)) {
      return
    }

    try {
      const token = localStorage.getItem('urlaub_token')
      if (!token) {
        alert('Fehler: Kein gültiges Token gefunden. Bitte melden Sie sich neu an.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}/permanent-delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        console.log('Delete erfolgreich')
        // Keine Erfolgsmeldung - Benutzer sieht es in der Liste
        fetchUsers() // Liste aktualisieren
      } else {
        console.log('Delete Fehler:', response.status)
        const error = await response.json()
        if (response.status === 401 || response.status === 403) {
          alert(`Authentifizierungsfehler: ${error.error}. Bitte melden Sie sich neu an.`)
          // KEIN localStorage.removeItem() - das löst Weiterleitungen aus!
          // localStorage.removeItem('urlaub_token')
          // localStorage.removeItem('urlaub_user')
        } else {
          alert(`Fehler beim Löschen: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
      alert('Fehler beim Löschen des Benutzers')
    }
  }

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(marketForm)
      })

      if (response.ok) {
        setShowMarketForm(false)
        setMarketForm({
          name: '',
          address: '',
          phone: '',
          email: ''
        })
        fetchMarkets()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Marktes:', error)
      alert('Fehler beim Erstellen des Marktes')
    }
  }

  const handleUpdateUser = async (userId: number, updates: Partial<User>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setEditingUser(null)
        fetchUsers()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error)
      alert('Fehler beim Aktualisieren des Benutzers')
    }
  }

  const handleUpdateMarket = async (marketId: number, updates: Partial<Market>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/markets/${marketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setEditingMarket(null)
        fetchMarkets()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Marktes:', error)
      alert('Fehler beim Aktualisieren des Marktes')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />
      case 'manager': return <Building className="w-4 h-4 text-blue-500" />
      case 'employee': return <Users className="w-4 h-4 text-green-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'employee': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Zugriff verweigert</h3>
        <p className="text-red-600">Sie haben keine Berechtigung für diesen Bereich.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
    <div className="card-modern bg-base-100 shadow max-w-6xl mx-auto">
      <div className="card-body">
      {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
        <div>
            <h2 className="card-title" style={{ fontSize: '28px', marginBottom: '8px' }}>
              👥 Mitarbeiter-Verwaltung
            </h2>
            <p className="text-base-content/70">Verwalten Sie Mitarbeiter für E-Center und Edeka</p>
        </div>
        
        {/* Jahresinfo */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Urlaubsjahr: {selectedYear}</span>
        </div>
      </div>

      {/* Mitarbeiter Content */}
          {/* Statistiken */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ 
            backgroundColor: '#dbeafe', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #93c5fd'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Users size={32} style={{ color: '#3b82f6', marginRight: '12px' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af', margin: 0 }}>Gesamt Mitarbeiter</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>{users.length}</p>
              </div>
            </div>
          </div>
          <div style={{ 
            backgroundColor: '#fef2f2', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #fecaca'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Shield size={32} style={{ color: '#ef4444', marginRight: '12px' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626', margin: 0 }}>Admins</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #7dd3fc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Building size={32} style={{ color: '#0ea5e9', marginRight: '12px' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#0284c7', margin: 0 }}>Manager</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7', margin: 0 }}>
                {users.filter(u => u.role === 'manager').length}
              </p>
            </div>
          </div>
        </div>
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #86efac'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <MapPin size={32} style={{ color: '#22c55e', marginRight: '12px' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#16a34a', margin: 0 }}>Märkte</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{markets.length}</p>
            </div>
          </div>
        </div>
      </div>

        {/* Info über fixe Märkte */}
        <div style={{ 
          backgroundColor: '#dbeafe', 
          padding: '16px', 
          borderRadius: '12px', 
          marginBottom: '32px',
          border: '1px solid #93c5fd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Building size={20} style={{ color: '#3b82f6', marginRight: '8px' }} />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', margin: 0 }}>Verfügbare Märkte</h4>
              <p style={{ fontSize: '14px', color: '#3b82f6', margin: 0 }}>E-Center und Edeka (fest konfiguriert)</p>
          </div>
        </div>
      </div>

      {/* Mitarbeiter-Verwaltung */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              👥 Mitarbeiter
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(true)
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
              }}
              className="btn-modern btn-primary-modern"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <UserPlus size={18} />
              Neuen Mitarbeiter
            </button>
          </div>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              padding: '16px 24px', 
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr 1fr', 
                gap: '16px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div>Name</div>
                <div>Rolle</div>
                <div>Markt & Abteilung</div>
                <div>Urlaub</div>
                <div>Status</div>
                <div>Aktionen</div>
          </div>
        </div>
            <div>
              {users.map((user, index) => (
                <div 
                  key={user.id} 
                  style={{ 
                    padding: '20px 24px',
                    borderBottom: index < users.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr 1fr', 
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {getRoleIcon(user.role)}
                      <div style={{ marginLeft: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{user.fullName}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.username}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '20px',
                        backgroundColor: user.role === 'admin' ? '#fef2f2' : user.role === 'manager' ? '#eff6ff' : '#f0fdf4',
                        color: user.role === 'admin' ? '#dc2626' : user.role === 'manager' ? '#2563eb' : '#16a34a'
                      }}>
                        {user.role === 'admin' ? '🔧' : user.role === 'manager' ? '👔' : '👤'} {user.role}
                    </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        🏪 {markets.find(m => m.id === user.market_id)?.name || 'Unbekannt'}
                    </div>
                    {user.department && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>📋 {user.department}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: '#1f2937' }}>
                        <span style={{ fontWeight: '500' }}>36</span> Tage/Jahr
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Resturlaub: später</div>
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '20px',
                        backgroundColor: user.is_active ? '#f0fdf4' : '#fef2f2',
                        color: user.is_active ? '#16a34a' : '#dc2626'
                      }}>
                        {user.is_active ? '✅ Aktiv' : '❌ Inaktiv'}
                    </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEditingUser(user)}
                        style={{
                          padding: '6px',
                          backgroundColor: '#dbeafe',
                          color: '#2563eb',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit size={16} />
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        style={{
                          padding: '6px',
                          backgroundColor: user.is_active ? '#fef3c7' : '#f0fdf4',
                          color: user.is_active ? '#d97706' : '#16a34a',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title={user.is_active ? 'Mitarbeiter deaktivieren' : 'Mitarbeiter reaktivieren'}
                      >
                        {user.is_active ? <UserX size={16} /> : <Eye size={16} />}
                      </button>
                      {user.is_active && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '6px',
                            backgroundColor: '#7f1d1d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Mitarbeiter DAUERHAFT löschen"
                        >
                          <Trash2 size={16} />
                    </button>
                      )}
                    </div>
        </div>
      </div>
              </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>

      {/* Popup als Portal außerhalb des Containers */}
      {showCreateForm && createPortal(
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.4)', 
          backdropFilter: 'blur(8px)',
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'center', 
          zIndex: 9999, 
          padding: '2rem',
          paddingTop: '2rem'
        }}>
          <div className="card-modern bg-base-100 shadow w-full max-w-2xl" style={{ maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                  <h2 className="card-title justify-center" style={{ fontSize: '24px', marginBottom: '8px' }}>
                    👤 Neuen Mitarbeiter erstellen
                  </h2>
                  <p className="text-base-content/70 text-center">Alle erforderlichen Informationen eingeben</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#6b7280'
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateUser}>
                {/* Persönliche Daten */}
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} />
                    Vorname
                  </label>
                <input
                    type="text"
                    className="input-modern"
                    value={userForm.firstName}
                    onChange={(e) => handleNameChange('firstName', e.target.value)}
                    placeholder="z.B. Max"
                  required
                />
              </div>

                <div className="form-group">
                  <label className="form-label">
                    <User size={16} />
                    Nachname
                  </label>
                <input
                  type="text"
                    className="input-modern"
                    value={userForm.lastName}
                    onChange={(e) => handleNameChange('lastName', e.target.value)}
                    placeholder="z.B. Mustermann"
                  required
                />
              </div>

                {/* Automatisch generierte Daten */}
                {(userForm.firstName || userForm.lastName) && (
                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h5 style={{ fontWeight: '600', marginBottom: '12px', color: '#475569' }}>
                      📋 Automatisch generiert:
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                        <span style={{ color: '#64748b' }}>Vollständiger Name:</span>
                        <div style={{ 
                          fontFamily: 'monospace', 
                          backgroundColor: '#ffffff', 
                          padding: '8px 12px', 
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          marginTop: '4px'
                        }}>
                          {userForm.fullName}
                        </div>
              </div>
              <div>
                        <span style={{ color: '#64748b' }}>Benutzername:</span>
                        <div style={{ 
                          fontFamily: 'monospace', 
                          backgroundColor: '#ffffff', 
                          padding: '8px 12px', 
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          marginTop: '4px'
                        }}>
                          {userForm.username}
                        </div>
                      </div>
                    </div>
              </div>
                )}

                {/* Markt */}
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={16} />
                    Markt
                  </label>
                <select
                    className="input-modern"
                  value={userForm.marketId}
                  onChange={(e) => setUserForm({...userForm, marketId: parseInt(e.target.value)})}
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
                  onChange={(e) => setUserForm({...userForm, department: e.target.value})}
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
                    value={userForm.urlaubsanspruch}
                    onChange={(e) => setUserForm({...userForm, urlaubsanspruch: parseInt(e.target.value)})}
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
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as any})}
                  >
                    <option value="employee">👤 Mitarbeiter</option>
                    <option value="manager">👔 Manager</option>
                    <option value="admin">🔧 Admin</option>
                  </select>
                </div>

                {/* E-Mail Info */}
                {userForm.username && (
                  <div style={{ 
                    backgroundColor: '#dbeafe', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    border: '1px solid #93c5fd'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Mail size={16} style={{ marginRight: '8px', color: '#3b82f6' }} />
                      <h5 style={{ fontWeight: '600', color: '#1e40af' }}>E-Mail wird automatisch generiert</h5>
              </div>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '16px',
                      backgroundColor: '#ffffff', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid #93c5fd'
                    }}>
                      {userForm.username}@{userForm.marketId === 2 ? 'ecenter' : 'edeka'}.de
          </div>
        </div>
      )}

                {/* Automatisch generiertes Passwort */}
                {userForm.password && (
                  <div style={{ 
                    backgroundColor: '#fef3c7', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    border: '1px solid #fbbf24'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Lock size={16} style={{ marginRight: '8px', color: '#d97706' }} />
                      <h5 style={{ fontWeight: '600', color: '#92400e' }}>Automatisch generiertes Passwort:</h5>
              </div>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '18px', 
                      fontWeight: '600',
                      backgroundColor: '#ffffff', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid #fbbf24',
                      marginBottom: '8px'
                    }}>
                      {userForm.password}
              </div>
                    <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                      ⚠️ Bitte notieren Sie sich das Passwort - es wird dem Mitarbeiter mitgeteilt.
                    </p>
              </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                    className="btn-modern btn-primary-modern"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <UserPlus size={18} />
                    Mitarbeiter erstellen
                </button>
                <button
                  type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-modern"
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Eye size={18} />
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>,
        document.body
      )}
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 10000,
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? '#059669' : '#dc2626',
          color: 'white',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          border: `2px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
          maxWidth: '400px',
          animation: 'fadeIn 0.5s ease-in-out'
        }}>
          {toast.message}
    </div>
      )}
    </>
  )
}

export default AdminMitarbeiterVerwaltung

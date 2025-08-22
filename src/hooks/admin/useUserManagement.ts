import { useState, useEffect } from 'react'
import { User, Market, UserFormData, Toast } from '../../types/admin/user'
import { userService } from '../../services/admin/userService'
import { useAuth } from '../../contexts/AuthContext'
import { useYear } from '../../contexts/YearContext'

export const useUserManagement = () => {
  const { getToken } = useAuth()
  const { selectedYear } = useYear()
  const [users, setUsers] = useState<User[]>([])
  const [markets] = useState<Market[]>([
    { id: 2, name: 'E-Center', address: '', phone: '', email: '' },
    { id: 3, name: 'Edeka', address: '', phone: '', email: '' }
  ])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Formular-Zustände
  const [userForm, setUserForm] = useState<UserFormData>({
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

  // Toast-Funktion
  const showToast = (message: string, type: 'success' | 'error' = 'success', duration: number = 5000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }

  // Benutzer laden
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const users = await userService.fetchUsers()
      // Nach Nachnamen sortieren
      const sortedUsers = users.sort((a, b) => {
        const namePartsA = a.fullName.trim().split(' ')
        const namePartsB = b.fullName.trim().split(' ')
        const nachNameA = namePartsA.length > 1 ? namePartsA[namePartsA.length - 1] : a.fullName
        const nachNameB = namePartsB.length > 1 ? namePartsB[namePartsB.length - 1] : b.fullName
        return nachNameA.localeCompare(nachNameB, 'de', { sensitivity: 'base' })
      })
      setUsers(sortedUsers)
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialisierung
  useEffect(() => {
    fetchUsers()
  }, [])

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
    
    // Nur bei CREATE-Modus automatisch Benutzername und Passwort generieren
    if (!editingUser) {
      const credentials = generateCredentials(newForm.firstName, newForm.lastName)
      newForm.username = credentials.username
      newForm.password = credentials.password
    }
    
    setUserForm(newForm)
  }

  // Benutzer bearbeiten
  const handleEditUser = async (user: User) => {
    setEditingUser(user)
    const nameParts = user.fullName.split(' ')
    
    // Erst das Formular mit Standardwerten setzen
    const initialForm = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      username: user.username,
      fullName: user.fullName,
      password: '',
      role: user.role,
      marketId: user.market_id,
      department: user.department || '',
      urlaubsanspruch: 25 // Standardwert
    }
    setUserForm(initialForm)
    setShowEditForm(true)
    
    // Dann asynchron das Budget laden und das Formular aktualisieren
    try {
      console.log('Lade Budget für User:', user.id, 'Jahr:', selectedYear)
      const response = await fetch(`/api/urlaub/budget/all?jahr=${selectedYear}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const budgetData = await response.json()
        console.log('Budget-Daten erhalten:', budgetData)
        const userBudget = budgetData.budgets?.find((b: any) => b.mitarbeiterId === user.id)
        console.log('User-Budget gefunden:', userBudget)
        if (userBudget && userBudget.jahresanspruch) {
          const urlaubsanspruch = parseInt(userBudget.jahresanspruch) || 25
          console.log('Urlaubsanspruch gesetzt auf:', urlaubsanspruch)
          // Formular mit korrektem Budget-Wert aktualisieren
          setUserForm(prev => ({ ...prev, urlaubsanspruch }))
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Urlaubsbudgets:', error)
    }
  }

  // Passwort zurücksetzen (ohne Modal)
  const handleResetPassword = async (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!confirm(`Möchten Sie das Passwort für "${user.fullName}" zurücksetzen?`)) {
      return
    }

    try {
      const newPassword = await userService.resetPassword(userId)
      
      // Passwort in die Zwischenablage kopieren
      try {
        await navigator.clipboard.writeText(newPassword)
        showToast(`✅ Passwort für "${user.fullName}" erfolgreich zurückgesetzt!\n\n🔑 Neues Passwort: ${newPassword}\n\n📋 Das Passwort wurde automatisch in die Zwischenablage kopiert.`, 'success', 15000)
      } catch (clipboardError) {
        // Fallback wenn Clipboard API nicht verfügbar ist
        showToast(`✅ Passwort für "${user.fullName}" erfolgreich zurückgesetzt!\n\n🔑 Neues Passwort: ${newPassword}\n\n⚠️ Bitte kopieren Sie das Passwort manuell!`, 'success', 15000)
      }
    } catch (error) {
      console.error('Fehler beim Passwort-Reset:', error)
      showToast(`❌ Fehler beim Zurücksetzen des Passworts für "${user.fullName}"`, 'error')
    }
  }

  // Passwort zurücksetzen (für Modal)
  const resetPasswordForModal = async (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return null

    try {
      const newPassword = await userService.resetPassword(userId)
      return { user, newPassword }
    } catch (error) {
      console.error('Fehler beim Passwort-Reset:', error)
      showToast(`❌ Fehler beim Zurücksetzen des Passworts für "${user.fullName}"`, 'error')
      throw error
    }
  }

  // Eigenes Passwort setzen
  const setCustomPassword = async (userId: number, password: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    try {
      await userService.setCustomPassword(userId, password)
      showToast(`✅ Passwort für "${user.fullName}" erfolgreich gesetzt!`, 'success')
    } catch (error) {
      console.error('Fehler beim Setzen des Passworts:', error)
      showToast(`❌ Fehler beim Setzen des Passworts für "${user.fullName}"`, 'error')
      throw error
    }
  }

  // Benutzer aktualisieren
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return

    try {
      const updateData = {
        fullName: userForm.fullName,
        email: `${userForm.username}@unternehmen.de`,
        role: userForm.role,
        market_id: userForm.marketId,
        department: userForm.department,
        is_active: true
      }

      await userService.updateUser(editingUser.id, updateData)
      
      // Urlaubsbudget aktualisieren wenn sich der Anspruch geändert hat
      try {
        console.log('Aktualisiere Budget für User:', editingUser.id, 'auf', userForm.urlaubsanspruch, 'Tage')
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3002' : `http://${window.location.hostname}:3002`
        const response = await fetch(`${apiUrl}/api/urlaub/budget/${editingUser.id}/${selectedYear}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            jahresanspruch: userForm.urlaubsanspruch
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Budget-Update fehlgeschlagen:', response.status, errorText)
        } else {
          const result = await response.json()
          console.log('Budget erfolgreich aktualisiert:', result)
          
          // Frisch nachladen zur Bestätigung
          const freshResponse = await fetch(`${apiUrl}/api/urlaub/budget/${editingUser.id}/${selectedYear}`, {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Cache-Control': 'no-cache'
            }
          })
          if (freshResponse.ok) {
            const freshBudget = await freshResponse.json()
            console.log('Frisch geladenes Budget:', freshBudget)
          }
        }
      } catch (budgetError) {
        console.error('Fehler beim Aktualisieren des Urlaubsbudgets:', budgetError)
        // Nicht als kritischen Fehler behandeln
      }
      
      showToast('Mitarbeiter erfolgreich aktualisiert!', 'success')
      setShowEditForm(false)
      setEditingUser(null)
      await fetchUsers() // Await hinzugefügt
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Mitarbeiters:', error)
      showToast('Fehler beim Aktualisieren des Mitarbeiters', 'error')
    }
  }

  // Benutzer erstellen
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await userService.createUser(userForm)
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
      
      // Automatisches Schließen nach 2 Sekunden
      setTimeout(() => setShowCreateForm(false), 2000)
      
      fetchUsers()
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error)
      showToast(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 'error')
    }
  }

  // Status umschalten (aktivieren/deaktivieren)
  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const action = isActive ? 'deaktivieren' : 'reaktivieren'
    if (!confirm(`Möchten Sie den Mitarbeiter "${user.fullName}" wirklich ${action}?`)) {
      return
    }

    try {
      await userService.toggleUserStatus(userId, isActive)
      fetchUsers()
    } catch (error) {
      console.error(`Fehler beim ${action} des Mitarbeiters:`, error)
      alert(`Fehler beim ${action} des Mitarbeiters`)
    }
  }

  // Benutzer permanent löschen
  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!confirm(`Möchten Sie den Mitarbeiter "${user.fullName}" dauerhaft löschen?\n\nDies kann nicht rückgängig gemacht werden!`)) {
      return
    }

    try {
      await userService.deleteUser(userId)
      fetchUsers()
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
      alert('Fehler beim Löschen des Benutzers')
    }
  }

  // Gefilterte Benutzer basierend auf Suchterm
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return {
    users: filteredUsers,
    markets,
    loading,
    showCreateForm,
    setShowCreateForm,
    editingUser,
    setEditingUser,
    showEditForm,
    setShowEditForm,
    toast,
    setToast,
    userForm,
    setUserForm,
    searchTerm,
    setSearchTerm,
    handleNameChange,
    handleEditUser,
    handleResetPassword,
    resetPasswordForModal,
    setCustomPassword,
    handleUpdateUser,
    handleCreateUser,
    handleToggleUserStatus,
    handleDeleteUser
  }
}

import { useState, useEffect } from 'react'
import { User, Market, UserFormData, Toast } from '../../types/admin/user'
import { userService } from '../../services/admin/userService'

export const useUserManagement = () => {
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
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  // Benutzer laden
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const users = await userService.fetchUsers()
      setUsers(users)
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
    
    // Automatisch Benutzername und Passwort generieren
    const credentials = generateCredentials(newForm.firstName, newForm.lastName)
    newForm.username = credentials.username
    newForm.password = credentials.password
    
    setUserForm(newForm)
  }

  // Benutzer bearbeiten
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    const nameParts = user.fullName.split(' ')
    setUserForm({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      username: user.username,
      fullName: user.fullName,
      password: '',
      role: user.role,
      marketId: user.market_id,
      department: user.department || '',
      urlaubsanspruch: 36
    })
    setShowEditForm(true)
  }

  // Passwort zurücksetzen
  const handleResetPassword = async (userId: number) => {
    if (!confirm('Möchten Sie das Passwort für diesen Mitarbeiter zurücksetzen?')) {
      return
    }

    try {
      const newPassword = await userService.resetPassword(userId)
      showToast(`Passwort erfolgreich zurückgesetzt! Neues Passwort: ${newPassword}`, 'success')
    } catch (error) {
      console.error('Fehler beim Passwort-Reset:', error)
      showToast('Fehler beim Zurücksetzen des Passworts', 'error')
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
      showToast('Mitarbeiter erfolgreich aktualisiert!', 'success')
      setShowEditForm(false)
      setEditingUser(null)
      fetchUsers()
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

  return {
    users,
    markets,
    loading,
    showCreateForm,
    setShowCreateForm,
    editingUser,
    setEditingUser,
    showEditForm,
    setShowEditForm,
    toast,
    userForm,
    setUserForm,
    handleNameChange,
    handleEditUser,
    handleResetPassword,
    handleUpdateUser,
    handleCreateUser,
    handleToggleUserStatus,
    handleDeleteUser
  }
}

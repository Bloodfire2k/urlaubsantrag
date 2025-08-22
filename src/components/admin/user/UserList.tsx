import React from 'react'
import { User, Building, ChevronRight, UserPlus, Trash, Edit, Lock, Ban, Eye, Calendar, Users, Shield, MapPin, Search } from 'lucide-react'
import { User as UserType } from '../../../types/admin/user'
import { useUserManagement } from '../../../hooks/admin/useUserManagement'
import { UserStatusBadge } from './UserStatusBadge'
import { UserModal } from './UserModal'
import { PasswordModal } from './PasswordModal'
import { useAuth } from '../../../contexts/AuthContext'
import { useYear } from '../../../contexts/YearContext'

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return <Shield className="w-8 h-8 text-purple-500" />
    case 'manager':
      return <Building className="w-8 h-8 text-blue-500" />
    default:
      return <User className="w-8 h-8 text-gray-500" />
  }
}

const UserList: React.FC = () => {
  const { user } = useAuth()
  const { selectedYear } = useYear()
  const {
    users,
    markets,
    loading,
    showCreateForm,
    setShowCreateForm,
    showEditForm,
    setShowEditForm,
    editingUser,
    setEditingUser,
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
  } = useUserManagement()

  // Password Modal State
  const [passwordModal, setPasswordModal] = React.useState<{
    isOpen: boolean
    user?: UserType
    newPassword?: string
  }>({ isOpen: false })

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Zugriff verweigert</h3>
        <p className="text-red-600">Sie haben keine Berechtigung für diesen Bereich.</p>
      </div>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-8 h-8 text-purple-500" />
      case 'manager':
        return <Building className="w-8 h-8 text-blue-500" />
      default:
        return <User className="w-8 h-8 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Password Modal Handlers
  const handleOpenPasswordModal = (selectedUser: UserType) => {
    setPasswordModal({
      isOpen: true,
      user: selectedUser
    })
  }

  const handleResetPasswordInModal = async () => {
    if (!passwordModal.user) return
    
    try {
      const result = await resetPasswordForModal(passwordModal.user.id)
      if (result) {
        setPasswordModal(prev => ({
          ...prev,
          newPassword: result.newPassword
        }))
      }
    } catch (error) {
      console.error('Fehler beim Generieren des Passworts:', error)
      throw error
    }
  }

  const handleSetCustomPassword = async (password: string) => {
    if (!passwordModal.user) return
    await setCustomPassword(passwordModal.user.id, password)
  }

  return (
    <>
      <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl md:text-3xl mb-4">
            👥 Mitarbeiter-Verwaltung
          </h2>
          <p className="text-base-content/70 mb-6">
            Verwalten Sie Mitarbeiter für E-Center und Edeka
          </p>

          {/* Statistiken */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="stat-card-modern">
              <div className="stat-figure text-white mb-4">
                <Users className="w-8 h-8" />
              </div>
              <div className="stat-number-modern">{users.length}</div>
              <div className="stat-label-modern">Gesamt Mitarbeiter</div>
            </div>

            <div className="stat-card-modern">
              <div className="stat-figure text-white mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <div className="stat-number-modern">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="stat-label-modern">Admins</div>
            </div>

            <div className="stat-card-modern">
              <div className="stat-figure text-white mb-4">
                <Building className="w-8 h-8" />
              </div>
              <div className="stat-number-modern">
                {users.filter(u => u.role === 'manager').length}
              </div>
              <div className="stat-label-modern">Manager</div>
            </div>

            <div className="stat-card-modern">
              <div className="stat-figure text-white mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <div className="stat-number-modern">{markets.length}</div>
              <div className="stat-label-modern">Märkte</div>
            </div>
          </div>

          {/* Info über fixe Märkte */}
          <div className="alert alert-info mb-8">
            <Building size={20} />
            <div>
              <h4 className="font-bold">Verfügbare Märkte</h4>
              <p className="text-sm">E-Center und Edeka (fest konfiguriert)</p>
            </div>
          </div>

          {/* Mitarbeiter-Verwaltung */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                👥 Mitarbeiter
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
                }}
                className="btn btn-primary btn-md gap-2"
              >
                <UserPlus size={18} />
                Neuen Mitarbeiter
              </button>
            </div>

            {/* Suchfeld */}
            <div className="list-item-modern card border border-base-300 bg-base-100 shadow rounded-2xl mb-6">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Search className="w-5 h-5 text-gray-600" />
                  <span className="text-lg font-semibold text-gray-700">Mitarbeiter durchsuchen</span>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full rounded-lg"
                  placeholder="Nach Mitarbeitern suchen (Name, Benutzername, E-Mail)"
                />
              </div>
            </div>

            <div className="space-y-4">
              {users.map(user => (
                <div
                  key={user.id}
                  className="list-item-modern card border border-base-300 bg-base-100 shadow rounded-2xl"
                >
                  <div className="card-body p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-bold text-lg">{user.fullName}</div>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <User className="w-4 h-4" />
                            <span>{user.username} • {user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <Building className="w-4 h-4" />
                            <span>
                              {markets.find(m => m.id === user.market_id)?.name || 'Unbekannt'}
                              {user.department && ` • ${user.department}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <UserStatusBadge user={user} />
                        
                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'} text-white font-medium px-4 py-2 rounded-full`}>
                          {user.is_active ? 'AKTIV' : 'INAKTIV'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn btn-circle btn-outline btn-sm hover:btn-primary"
                            title="Mitarbeiter bearbeiten"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            className="btn btn-circle btn-outline btn-sm hover:btn-warning"
                            title="Passwort verwalten"
                          >
                            <Lock size={16} />
                          </button>

                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            className="btn btn-circle btn-outline btn-sm hover:btn-warning"
                            title={user.is_active ? 'Mitarbeiter deaktivieren' : 'Mitarbeiter reaktivieren'}
                          >
                            {user.is_active ? <Ban size={16} /> : <Eye size={16} />}
                          </button>

                          {/* Löschen Button */}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-circle btn-error btn-sm"
                            title="Mitarbeiter DAUERHAFT löschen"
                          >
                            <span className="text-red-600 text-lg">🗑️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <UserModal
        isOpen={showCreateForm}
        mode="create"
        title="👤 Neuen Mitarbeiter erstellen"
        userForm={userForm}
        markets={markets}
        onClose={() => setShowCreateForm(false)}
        onNameChange={handleNameChange}
        onFormChange={setUserForm}
        onSubmit={handleCreateUser}
      />

      {/* Edit Modal */}
      <UserModal
        isOpen={showEditForm}
        mode="edit"
        title="✏️ Mitarbeiter bearbeiten"
        userForm={userForm}
        markets={markets}
        onClose={() => {
          setShowEditForm(false)
          setEditingUser(null)
        }}
        onNameChange={handleNameChange}
        onFormChange={setUserForm}
        onSubmit={handleUpdateUser}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={() => setPasswordModal({ isOpen: false })}
        userName={passwordModal.user?.fullName || ''}
        newPassword={passwordModal.newPassword}
        onSetCustomPassword={handleSetCustomPassword}
        onResetPassword={handleResetPasswordInModal}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 p-6 rounded-xl bg-white shadow-2xl border-2 max-w-lg animate-fade-in">
          <div className={`text-sm font-medium whitespace-pre-line leading-relaxed ${
            toast.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {toast.message}
          </div>
          <div className="mt-3 flex justify-end">
            <button 
              onClick={() => setToast(null)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default UserList

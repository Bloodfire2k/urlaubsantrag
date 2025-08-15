import React from 'react'
import { User, Building, ChevronRight, UserPlus, Trash2, Edit, Lock, Ban, Eye } from 'lucide-react'
import { useUserManagement } from '../../../hooks/admin/useUserManagement'
import { UserStatusBadge } from './UserStatusBadge'
import { UserModal } from './UserModal'
import { useAuth } from '../../../contexts/AuthContext'
import { useYear } from '../../../contexts/YearContext'

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
    userForm,
    setUserForm,
    handleNameChange,
    handleEditUser,
    handleResetPassword,
    handleUpdateUser,
    handleCreateUser,
    handleToggleUserStatus,
    handleDeleteUser
  } = useUserManagement()

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="card-title text-2xl mb-2">
                👥 Mitarbeiter-Verwaltung
              </h2>
              <p className="text-base-content/70">
                Verwalten Sie Mitarbeiter für E-Center und Edeka
              </p>
            </div>
            
            {/* Jahresinfo */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Urlaubsjahr: {selectedYear}</span>
            </div>
          </div>

          {/* Statistiken */}
          <div className="stats-modern">
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
          <div className="bg-blue-50 p-4 rounded-xl mb-8 border border-blue-200">
            <div className="flex items-center">
              <Building size={20} className="text-blue-600 mr-2" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Verfügbare Märkte</h4>
                <p className="text-sm text-blue-600">E-Center und Edeka (fest konfiguriert)</p>
              </div>
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
                className="btn-modern btn-primary-modern flex items-center gap-2"
              >
                <UserPlus size={18} />
                Neuen Mitarbeiter
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr_1fr] gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    className={`p-5 ${index < users.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr_1fr] gap-4 items-center">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-xs text-gray-500">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>

                      <div>
                        <UserStatusBadge user={user} />
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          🏪 {markets.find(m => m.id === user.market_id)?.name || 'Unbekannt'}
                        </div>
                        {user.department && (
                          <div className="text-xs text-gray-500">📋 {user.department}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">36</span> Tage/Jahr
                        </div>
                        <div className="text-xs text-gray-500">Resturlaub: später</div>
                      </div>

                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? '✅ Aktiv' : '❌ Inaktiv'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          title="Mitarbeiter bearbeiten"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
                          title="Passwort zurücksetzen"
                        >
                          <Lock size={16} />
                        </button>

                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          className={`p-1.5 rounded ${
                            user.is_active 
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                          title={user.is_active ? 'Mitarbeiter deaktivieren' : 'Mitarbeiter reaktivieren'}
                        >
                          {user.is_active ? <Ban size={16} /> : <Eye size={16} />}
                        </button>

                        {user.is_active && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 bg-red-900 text-white rounded hover:bg-red-800"
                            title="Mitarbeiter DAUERHAFT löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 p-4 rounded-xl bg-white shadow-lg border-2 max-w-md animate-fade-in">
          <div className={`text-sm font-medium ${
            toast.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </>
  )
}

export default UserList

import React from 'react'
import { Shield, Building, Users } from 'lucide-react'
import { User } from '../../../types/admin/user'

interface UserStatusBadgeProps {
  user: User
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ user }) => {
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

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
      {getRoleIcon(user.role)}
      <span className="ml-1">
        {user.role === 'admin' ? '🔧' : user.role === 'manager' ? '👔' : '👤'} {user.role}
      </span>
    </span>
  )
}

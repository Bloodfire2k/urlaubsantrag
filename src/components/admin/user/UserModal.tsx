import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { UserForm } from './UserForm'
import { UserFormData, Market } from '../../../types/admin/user'

interface UserModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  title: string
  userForm: UserFormData
  markets: Market[]
  onClose: () => void
  onNameChange: (field: 'firstName' | 'lastName', value: string) => void
  onFormChange: (updates: Partial<UserFormData>) => void
  onSubmit: (e: React.FormEvent) => void
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  mode,
  title,
  userForm,
  markets,
  onClose,
  onNameChange,
  onFormChange,
  onSubmit
}) => {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-8 pt-8">
      <div className="card-modern bg-base-100 shadow w-full max-w-2xl" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="card-title justify-center text-2xl mb-2">
                {title}
              </h2>
              <p className="text-base-content/70 text-center">
                {mode === 'create' 
                  ? 'Alle erforderlichen Informationen eingeben'
                  : 'Mitarbeiterdaten bearbeiten'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <UserForm
            userForm={userForm}
            markets={markets}
            onNameChange={onNameChange}
            onFormChange={onFormChange}
            onSubmit={onSubmit}
            onCancel={onClose}
            mode={mode}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

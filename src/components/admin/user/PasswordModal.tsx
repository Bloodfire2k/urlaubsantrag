import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Eye, EyeOff, Copy, Check, X, Key, Lock } from 'lucide-react'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  newPassword?: string
  onSetCustomPassword?: (password: string) => Promise<void>
  onResetPassword?: () => Promise<void>
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  userName,
  newPassword,
  onSetCustomPassword,
  onResetPassword
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [customPassword, setCustomPassword] = useState('')
  const [showCustomPassword, setShowCustomPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSettingCustom, setIsSettingCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(!newPassword) // Zeige Bestätigung wenn kein Passwort vorhanden
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && passwordRef.current) {
      passwordRef.current.select()
    }
  }, [isOpen])

  const handleCopy = async () => {
    const textToCopy = newPassword || customPassword
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback für ältere Browser
      if (passwordRef.current) {
        passwordRef.current.select()
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleSetCustomPassword = async () => {
    if (!customPassword.trim() || !onSetCustomPassword) return
    
    setIsLoading(true)
    try {
      await onSetCustomPassword(customPassword)
      setCustomPassword('')
      setIsSettingCustom(false)
      onClose()
    } catch (error) {
      console.error('Fehler beim Setzen des Passworts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCustomPassword('')
    setIsSettingCustom(false)
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div 
      style={{ 
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
      }}
      onClick={onClose}
    >
      <div 
        className="card-modern bg-base-100 shadow w-full max-w-2xl"
        style={{ maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 className="card-title justify-center" style={{ fontSize: '24px', marginBottom: '8px' }}>
                🔐 Passwort verwalten - {userName}
              </h2>
              <p className="text-base-content/70 text-center">Passwort zurücksetzen oder eigenes Passwort festlegen</p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: '#6b7280'
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Content */}
          {!newPassword && !isSettingCustom && (
            <div className="list-item-modern card border border-base-300 bg-base-100 shadow rounded-2xl">
              <div className="card-body p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} className="text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Passwort zurücksetzen?</h3>
                  <p className="text-gray-600 mb-2">
                    Möchten Sie wirklich das Passwort für <strong>{userName}</strong> zurücksetzen?
                  </p>
                  <p className="text-gray-500 text-sm">
                    Ein neues, zufälliges Passwort wird automatisch generiert.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Neues Passwort anzeigen (wenn vorhanden) */}
          {newPassword && !isSettingCustom && (
            <div className="space-y-6">
              <div className="list-item-modern card border border-base-300 bg-base-100 shadow rounded-2xl">
                <div className="card-body p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        Passwort erfolgreich zurückgesetzt!
                      </div>
                      <p className="text-gray-600 text-sm">
                        Das neue Passwort wurde automatisch generiert.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Neues Passwort
                    </label>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg font-mono text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newPassword}
                        readOnly
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className={`p-2 rounded-lg transition-colors ${
                            copied 
                              ? 'text-green-600 bg-green-100' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="In Zwischenablage kopieren"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    {copied && (
                      <p className="text-green-600 text-sm flex items-center gap-1">
                        <Check size={14} />
                        In Zwischenablage kopiert!
                      </p>
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Wichtig:</strong> Bitte teilen Sie dieses Passwort sicher mit dem Benutzer mit. 
                      Es wird aus Sicherheitsgründen nicht erneut angezeigt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Eigenes Passwort setzen */}
          {isSettingCustom && (
            <div className="list-item-modern card border border-base-300 bg-base-100 shadow rounded-2xl">
              <div className="card-body p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <Key className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      Eigenes Passwort festlegen
                    </div>
                    <p className="text-gray-600 text-sm">
                      Legen Sie ein individuelles Passwort für den Benutzer fest.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Neues Passwort eingeben
                  </label>
                  <div className="relative">
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mindestens 6 Zeichen"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => setShowCustomPassword(!showCustomPassword)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={showCustomPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                      >
                        {showCustomPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Das Passwort sollte mindestens 6 Zeichen lang sein.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            {!newPassword && !isSettingCustom ? (
              // Bestätigungsbuttons
              <>
                <button
                  onClick={handleClose}
                  className="btn btn-sm btn-ghost min-w-[120px]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => setIsSettingCustom(true)}
                  className="btn btn-sm btn-outline btn-primary min-w-[160px]"
                >
                  Eigenes Passwort setzen
                </button>
                <button
                  onClick={async () => {
                    if (onResetPassword) {
                      setIsLoading(true)
                      try {
                        await onResetPassword()
                      } catch (error) {
                        console.error('Fehler beim Passwort-Reset:', error)
                      } finally {
                        setIsLoading(false)
                      }
                    }
                  }}
                  disabled={isLoading}
                  className="btn btn-sm btn-error min-w-[160px]"
                >
                  {isLoading ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
                </button>
              </>
            ) : newPassword && !isSettingCustom ? (
              // Nach erfolgreichem Reset
              <>
                <button
                  onClick={() => setIsSettingCustom(true)}
                  className="btn btn-sm btn-outline btn-primary min-w-[160px]"
                >
                  Eigenes Passwort setzen
                </button>
                <button
                  onClick={handleClose}
                  className="btn btn-sm btn-primary min-w-[120px]"
                >
                  Schließen
                </button>
              </>
            ) : (
              // Eigenes Passwort setzen
              <>
                <button
                  onClick={handleClose}
                  className="btn btn-sm btn-ghost min-w-[120px]"
                  disabled={isLoading}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSetCustomPassword}
                  disabled={!customPassword.trim() || customPassword.length < 6 || isLoading}
                  className="btn btn-sm btn-primary min-w-[140px]"
                >
                  {isLoading ? 'Wird gesetzt...' : 'Passwort setzen'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

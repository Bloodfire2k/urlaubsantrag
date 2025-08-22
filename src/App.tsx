import { useState, useEffect, useRef } from 'react'
import { useAuth } from './contexts/AuthContext'
import { YearProvider, useYear } from './contexts/YearContext'



import { ErrorBoundary } from './components/error/ErrorBoundary'
import { RouteErrorBoundary } from './components/error/RouteErrorBoundary'
import { ComponentErrorBoundary } from './components/error/ComponentErrorBoundary'
import LoginForm from './components/LoginForm'
import UrlaubForm from './components/UrlaubForm'
import { UrlaubList } from './components/UrlaubList.tsx'
import Stats from './components/Stats.tsx'
import UrlaubBilanz from './components/UrlaubBilanz'
import AdminMitarbeiterVerwaltung from './components/admin/user/UserList'

import Settings from './components/Settings'
import AdminUrlaubsUebersichtInline from './components/admin/overview/AdminUrlaubsUebersichtInline'
import Pruefung from './components/vacation/Pruefung'
import { Urlaub, UrlaubBudget, convertUrlaubFromBackend, convertUrlaubBudgetFromBackend } from './types/urlaub'

import { API_BASE, apiFetch } from './lib/api'

function AppContent() {
  const { user, logout, getToken } = useAuth()
  const { selectedYear, setIsAdmin } = useYear()
  

  const [urlaube, setUrlaube] = useState<Urlaub[]>([])
  const [budgets, setBudgets] = useState<UrlaubBudget[]>([])
  const [activeTab, setActiveTab] = useState<'urlaub' | 'pruefung' | 'mitarbeiter' | 'settings'>(() => {
    // Nur aus sessionStorage lesen, dann Fallback
    const saved = sessionStorage.getItem('activeTab')
    return (saved as 'urlaub' | 'pruefung' | 'mitarbeiter' | 'settings') || 'urlaub'
  })
  

  
  // Scroll to top when changing tabs
  const handleTabChange = (tab: 'urlaub' | 'pruefung' | 'mitarbeiter' | 'settings') => {
    console.log('🚨 Tab-Wechsel zu:', tab)
    console.trace('🚨 Tab-Wechsel aufgerufen von:')
    setActiveTab(tab)
    sessionStorage.setItem('activeTab', tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Daten neu laden wenn auf Übersicht-Tab gewechselt wird
    if (tab === 'urlaub' && user?.role === 'admin') {
      console.log('🔄 Lade Daten neu für Admin-Übersicht')
      loadUrlaube()
      loadBudgets()
    }
  }
  

  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<number | null>(() => {
    // Modal-State überleben lassen auch bei Navigation
    const saved = sessionStorage.getItem('selectedMitarbeiter');
    return saved ? parseInt(saved) : null;
  })
  const mobileMenuRef = useRef<HTMLDivElement>(null)


  // Admin-Status setzen wenn User sich ändert
  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'admin')
      loadUrlaube()
      loadBudgets()
    }
  }, [user, setIsAdmin])

  // Daten neu laden wenn Jahr sich ändert
  const lastLoadedYearRef = useRef<number | null>(null);
  useEffect(() => {
    if (!user) return;
    if (lastLoadedYearRef.current === selectedYear) return;
    lastLoadedYearRef.current = selectedYear;
    console.log('📅 Jahr geändert, lade Daten neu für Jahr:', selectedYear);
    loadUrlaube();
    loadBudgets();
  }, [user, selectedYear])

  // Event-Listener für Statusänderungen von der Prüfungsseite
  useEffect(() => {
    const handleUrlaubStatusChanged = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Statusänderung erkannt:', customEvent.detail);
      console.log('🔄 Lade Daten neu...');
      
      try {
        await loadUrlaube();
        await loadBudgets();
        console.log('✅ Daten erfolgreich neu geladen');
        
        // Force re-render der Admin-Übersicht
        setUrlaube(prev => [...prev]);
        
      } catch (error) {
        console.error('❌ Fehler beim Neuladen der Daten:', error);
      }
    };

    window.addEventListener('urlaubStatusChanged', handleUrlaubStatusChanged);
    
    return () => {
      window.removeEventListener('urlaubStatusChanged', handleUrlaubStatusChanged);
    };
  }, []);

  // URL-Synchronisation entfernt - nur sessionStorage verwenden

  const loadUrlaube = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('urlaub_token')
      const response = await apiFetch(`/urlaub?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const urlaubAntraege = data.urlaubAntraege || []
        const convertedUrlaube = urlaubAntraege.map(convertUrlaubFromBackend)
        setUrlaube(convertedUrlaube)
      } else {
        console.error('Fehler beim Laden der Urlaube:', response.statusText)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Urlaube:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBudgets = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('urlaub_token')
      const response = await apiFetch(`/urlaub/budget/all?jahr=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.budgets) {
          const convertedBudgets = data.budgets.map(convertUrlaubBudgetFromBackend)
          setBudgets(convertedBudgets)
        }
      } else {
        console.error('Fehler beim Laden der Budgets:', response.statusText)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAll = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      await Promise.all([loadUrlaube(), loadBudgets()])
    } finally {
      setIsLoading(false)
    }
  }

  const addUrlaub = async (urlaub: { mitarbeiterName: string; startDatum: string; endDatum: string }) => {
    if (!user) return

    try {
      const token = localStorage.getItem('urlaub_token')
      const response = await apiFetch(`/urlaub`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_datum: urlaub.startDatum,
          end_datum: urlaub.endDatum,
          bemerkung: ''
        })
      })

      if (response.ok) {
        await loadUrlaube()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Urlaubsantrags:', error)
      alert('Fehler beim Erstellen des Urlaubsantrags')
    }
  }

  const deleteUrlaub = async (id: string) => {
    try {
      const token = localStorage.getItem('urlaub_token')
      const response = await apiFetch(`/urlaub/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await loadUrlaube()
      } else {
        alert('Fehler beim Löschen des Urlaubsantrags')
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Urlaubsantrags:', error)
      alert('Fehler beim Löschen des Urlaubsantrags')
    }
  }

  const getTotalUrlaubstage = () => {
    return urlaube.reduce((total, urlaub) => {
      const start = new Date(urlaub.startDatum)
      const end = new Date(urlaub.endDatum)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return total + days
    }, 0)
  }

  const getAktuelleUrlaube = () => {
    const today = new Date()
    return urlaube.filter(urlaub => {
      const endDate = new Date(urlaub.endDatum)
      return endDate >= today
    })
  }

  const getVisibleUrlaube = () => {
    if (user?.role === 'admin') {
      return urlaube
    }
    return urlaube.filter(u => u.mitarbeiterId === user?.id)
  }

  const getFilteredUrlaube = () => {
    const query = search.trim().toLowerCase()
    const list = getVisibleUrlaube()
    if (!query) return list
    return list.filter(u => {
      const txt = [u.bemerkung, u.startDatum, u.endDatum, u.status].join(' ').toLowerCase()
      return txt.includes(query)
    })
  }

  // Mobile Menu Toggle Handler
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Initialize scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    const fadeElements = document.querySelectorAll('.fade-in-up')
    fadeElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [activeTab]) // Re-run when activeTab changes

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      {/* Änderung: Header-Layout angepasst - Überschrift zentriert, Abmelden-Button rechts. Grund: Benutzeranforderung für bessere Optik */}
      <header className="bg-base-100 border-b border-base-200">
        <div className="container">
          <div className="flex items-center justify-between py-4 px-0">
            {/* Linker Bereich - leer für Balance */}
            <div className="flex-1 hidden md:block"></div>
            
            {/* Zentrierte Überschrift */}
            <div className="flex-1 text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">Urlaubsmanager {selectedYear}</h1>
              <p className="text-base md:text-lg text-base-content/70 mt-1">
                Willkommen, {user.fullName}
              </p>
            </div>
            
            {/* Rechter Bereich - Abmelden Button */}
            <div className="flex-1 flex justify-end items-center">
              {/* Änderung: Abmelden-Button nur auf Desktop sichtbar. Grund: Auf mobilen Geräten ist er im Burger-Menü verfügbar */}
              <button onClick={logout} className="btn btn-outline btn-sm md:btn-md normal-case hidden lg:inline-flex">Abmelden</button>
              
              {/* Mobile Menu Toggle */}
              <button
                className="btn btn-ghost btn-circle lg:hidden"
                onClick={toggleMobileMenu}
                aria-label="Menü öffnen"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-base-100/90 backdrop-blur border-b border-base-200" ref={mobileMenuRef}>
        <div className="container">
          {/* Desktop Navigation */}
          <div className="join hidden md:flex">
            <button
              onClick={() => handleTabChange('urlaub')}
              className={`btn join-item btn-sm md:btn-md normal-case ${activeTab === 'urlaub' ? 'btn-primary' : 'btn-outline'}`}
            >Übersicht</button>

            {(user.role === 'admin' || user.role === 'manager') && (
              <button
                onClick={() => handleTabChange('pruefung')}
                className={`btn join-item btn-sm md:btn-md normal-case ${activeTab === 'pruefung' ? 'btn-primary' : 'btn-outline'}`}
              >Prüfung</button>
            )}
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => handleTabChange('mitarbeiter')}
                  className={`btn join-item btn-sm md:btn-md normal-case ${activeTab === 'mitarbeiter' ? 'btn-primary' : 'btn-outline'}`}
                >Mitarbeiterverwaltung</button>
                <button
                  onClick={() => handleTabChange('settings')}
                  className={`btn join-item btn-sm md:btn-md normal-case ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
                >Einstellungen</button>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          {/* Änderung: Mobile Navigation als kompaktes Dropdown mit Hintergrund-Blur gestaltet. Grund: Benutzeranforderung für bessere UX */}
          {isMobileMenuOpen && (
            <>
              {/* Blur-Overlay für Hintergrund */}
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>
              
              {/* Kompaktes Dropdown-Menü */}
              <div className="absolute top-full right-4 w-64 bg-white/95 backdrop-blur-lg rounded-2xl border border-base-200 shadow-2xl z-50 md:hidden">
                <div className="p-3 space-y-1">
                  <button
                    onClick={() => {
                      handleTabChange('urlaub')
                      setIsMobileMenuOpen(false)
                    }}
                    className={`btn btn-sm w-full justify-start ${activeTab === 'urlaub' ? 'btn-primary' : 'btn-ghost'}`}
                  >Übersicht</button>

                  {(user.role === 'admin' || user.role === 'manager') && (
                    <button
                      onClick={() => {
                        handleTabChange('pruefung')
                        setIsMobileMenuOpen(false)
                      }}
                      className={`btn btn-sm w-full justify-start ${activeTab === 'pruefung' ? 'btn-primary' : 'btn-ghost'}`}
                    >Prüfung</button>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          handleTabChange('mitarbeiter')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`btn btn-sm w-full justify-start ${activeTab === 'mitarbeiter' ? 'btn-primary' : 'btn-ghost'}`}
                      >Mitarbeiterverwaltung</button>
                      <button
                        onClick={() => {
                          handleTabChange('settings')
                          setIsMobileMenuOpen(false)
                        }}
                        className={`btn btn-sm w-full justify-start ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
                      >Einstellungen</button>
                    </>
                  )}
                  <div className="divider my-2"></div>
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false) }} 
                    className="btn btn-sm btn-ghost w-full justify-start text-red-600 hover:bg-red-50"
                  >Abmelden</button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-8">
        
        {activeTab === 'urlaub' && (
          <RouteErrorBoundary>
            <div className="space-y-8">
              {user.role !== 'admin' && (
                <>
                  {/* UrlaubForm - nur für normale Mitarbeiter */}
                  {/* Änderung: Urlaubsformular mit verbesserter Desktop-Zentrierung. Grund: Auf Desktop war es nicht richtig mittig */}
                  <ComponentErrorBoundary name="Urlaubsantrag-Formular">
                    <div className="flex justify-center">
                      <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl w-full max-w-4xl">
                      <div className="card-body gap-4">
                        <h2 className="card-title text-2xl md:text-3xl justify-center">Neuer Urlaubsantrag</h2>
                        <p className="text-base-content/70 text-center">Reichen Sie Ihren Urlaubsantrag ein</p>
                        <UrlaubForm onSubmit={addUrlaub} existingUrlaube={urlaube} />
                      </div>
                      </div>
                    </div>
                  </ComponentErrorBoundary>

                  {/* Button zum Löschen aller abgelehnten Urlaube */}
                  <ComponentErrorBoundary name="Abgelehnte-Urlaube-Löschen">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={async () => {
                          const rejectedUrlaube = urlaube.filter(u => u.mitarbeiterId === user.id && u.status === 'rejected')
                          if (rejectedUrlaube.length === 0) {
                            alert('Es gibt keine abgelehnten Urlaube zum Löschen.')
                            return
                          }
                          
                          if (confirm(`Möchten Sie wirklich alle ${rejectedUrlaube.length} abgelehnten Urlaubsanträge löschen?`)) {
                            setIsLoading(true)
                            let deletedCount = 0
                            
                            for (const urlaub of rejectedUrlaube) {
                              try {
                                console.log('🗑️ Versuche Urlaub zu löschen:', urlaub.id, 'Status:', urlaub.status)
                                const response = await apiFetch(`/urlaub/${urlaub.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${getToken()}`
                                  }
                                })
                                console.log('🗑️ Response Status:', response.status, 'OK:', response.ok)
                                
                                if (!response.ok) {
                                  const errorText = await response.text()
                                  console.error('🗑️ API Fehler:', response.status, errorText)
                                } else {
                                  deletedCount++
                                  console.log('✅ Urlaub erfolgreich gelöscht:', urlaub.id)
                                }
                              } catch (error) {
                                console.error('❌ Netzwerk-Fehler beim Löschen von Urlaub:', urlaub.id, error)
                              }
                            }
                            
                            await loadUrlaube()
                            setIsLoading(false)
                            alert(`${deletedCount} abgelehnte Urlaubsanträge wurden erfolgreich gelöscht.`)
                          }
                        }}
                        className="btn btn-outline btn-error btn-sm"
                        disabled={isLoading || urlaube.filter(u => u.mitarbeiterId === user.id && u.status === 'rejected').length === 0}
                      >
                        🗑️ Alle abgelehnten Urlaube löschen
                      </button>
                    </div>
                  </ComponentErrorBoundary>

                  {/* Statistiken - nur für normale Mitarbeiter */}
                  <ComponentErrorBoundary name="Urlaubsstatistiken">
                    <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
                      <div className="card-body gap-4">
                        <h2 className="card-title text-2xl md:text-3xl">Meine Übersicht</h2>
                        <p className="text-base-content/70">Ihre Urlaubsstatistiken</p>
                        <Stats
                          budget={budgets.find(b => b.mitarbeiterId === user.id.toString() && b.jahr === selectedYear)}
                          urlaube={urlaube.filter(u => u.mitarbeiterId === user.id)}
                        />
                      </div>
                    </div>
                  </ComponentErrorBoundary>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  {/* Admin Urlaubsübersicht - Neue umfassende Komponente */}
                  <ComponentErrorBoundary name="Admin-Urlaubsübersicht">
                    <AdminUrlaubsUebersichtInline 
                      allUrlaube={urlaube.map(u => ({
                        ...u,
                        mitarbeiterId: parseInt(u.mitarbeiterId)
                      }))} 
                      onDataChange={() => {
                        loadUrlaube();
                        loadBudgets();
                      }}
                      selectedMitarbeiter={selectedMitarbeiter}
                      setSelectedMitarbeiter={(id) => {
                        setSelectedMitarbeiter(id);
                        if (id === null) {
                          sessionStorage.removeItem('selectedMitarbeiter');
                        } else {
                          sessionStorage.setItem('selectedMitarbeiter', String(id));
                        }
                      }}
                    />
                  </ComponentErrorBoundary>
                </>
              )}

              {/* UrlaubList - nur für Mitarbeiter, nicht für Admins */}
              {user.role !== 'admin' && (
                <ComponentErrorBoundary name="Urlaubsliste">
                  <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
                    <div className="card-body gap-4">
                      <h2 className="card-title text-2xl md:text-3xl">
                        📋 Meine Urlaubsanträge
                      </h2>
                      <p className="text-base-content/70">
                        Alle Ihre eingereichten Anträge
                      </p>
                      {/* Searchbar */}
                      <div className="form-control">
                        <label className="input input-bordered flex items-center gap-2 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-70">
                            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.217 12.042l4.745 4.746a.75.75 0 1 0 1.06-1.06l-4.746-4.746A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
                          </svg>
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="grow"
                            placeholder="Nach Anträgen suchen (Datum, Status, Bemerkung)"
                          />
                        </label>
                      </div>
                      <UrlaubList
                        urlaube={getFilteredUrlaube()}
                      onDelete={deleteUrlaub}
                      isAdmin={false}
                      />
                    </div>
                  </div>
                </ComponentErrorBoundary>
              )}
            </div>
          </RouteErrorBoundary>
        )}



        {/* Änderung: Prüfung-Tab-Inhalt hinzugefügt. Grund: Neue Prüfungsseite */}
        {activeTab === 'pruefung' && (
          <RouteErrorBoundary>
            <div className="space-y-8">
              <ComponentErrorBoundary name="Prüfungsübersicht">
                <Pruefung />
              </ComponentErrorBoundary>
            </div>
          </RouteErrorBoundary>
        )}

        {activeTab === 'mitarbeiter' && user.role === 'admin' && (
          <RouteErrorBoundary>
            <div className="space-y-8">
              <ComponentErrorBoundary name="Mitarbeiterverwaltung">
                <AdminMitarbeiterVerwaltung />
              </ComponentErrorBoundary>
            </div>
          </RouteErrorBoundary>
        )}

        {activeTab === 'settings' && user.role === 'admin' && (
          <RouteErrorBoundary>
            <div className="space-y-8">
              <ComponentErrorBoundary name="Einstellungen">
                <Settings />
              </ComponentErrorBoundary>
            </div>
          </RouteErrorBoundary>
        )}
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-900">Lade Daten...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <YearProvider>
        <AppContent />
      </YearProvider>
    </ErrorBoundary>
  )
}

export default App
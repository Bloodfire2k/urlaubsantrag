import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

interface YearContextType {
  selectedYear: number
  setSelectedYear: (year: number) => void
  isAdmin: boolean
  setIsAdmin: (isAdmin: boolean) => void
}

const YearContext = createContext<YearContextType | undefined>(undefined)

export const YearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const setSelectedYearIdempotent = useCallback((next: number) => {
    setSelectedYear(prev => {
      if (prev === next) return prev; // Idempotent - keine Änderung wenn gleicher Wert
      
      // Jahr global für alle Benutzer speichern
      localStorage.setItem('global_vacation_year', next.toString())
      console.log('📅 Jahr geändert zu:', next)
      return next;
    })
  }, [])

  // Jahr beim Start laden (für alle Benutzer)
  useEffect(() => {
    const savedYear = localStorage.getItem('global_vacation_year')
    const currentYear = new Date().getFullYear()
    
    if (savedYear) {
      const parsedYear = parseInt(savedYear)
      // Prüfe ob das gespeicherte Jahr in der Zukunft liegt
      if (parsedYear > currentYear + 1) {
        // Setze auf aktuelles Jahr zurück
        setSelectedYearIdempotent(currentYear)
      } else {
        setSelectedYear(parsedYear)
      }
    } else {
      // Wenn kein Jahr gespeichert ist, das aktuelle Jahr speichern
      setSelectedYearIdempotent(currentYear)
    }
  }, [setSelectedYearIdempotent])

  // URL-Synchronisation erfolgt in App.tsx - hier nur State verwalten

  return (
    <YearContext.Provider value={{
      selectedYear,
      setSelectedYear: setSelectedYearIdempotent,
      isAdmin,
      setIsAdmin
    }}>
      {children}
    </YearContext.Provider>
  )
}

export const useYear = () => {
  const context = useContext(YearContext)
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider')
  }
  return context
}

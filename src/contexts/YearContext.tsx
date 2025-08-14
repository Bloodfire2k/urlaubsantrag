import React, { createContext, useContext, useState, useEffect } from 'react'

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

  // Jahr beim Start laden (für alle Benutzer)
  useEffect(() => {
    const savedYear = localStorage.getItem('global_vacation_year')
    if (savedYear) {
      setSelectedYear(parseInt(savedYear))
    }
  }, [])

  const handleSetSelectedYear = (year: number) => {
    setSelectedYear(year)
    // Jahr global für alle Benutzer speichern
    localStorage.setItem('global_vacation_year', year.toString())
    console.log('📅 Jahr geändert zu:', year)
  }

  return (
    <YearContext.Provider value={{
      selectedYear,
      setSelectedYear: handleSetSelectedYear,
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

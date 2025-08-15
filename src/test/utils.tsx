import React from 'react'
import { render } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import { YearProvider } from '../contexts/YearContext'

// Test-Wrapper mit allen notwendigen Providern
export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <YearProvider>
        {children}
      </YearProvider>
    </AuthProvider>
  )
}

// Custom render mit Providern
export const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Re-exportiere alles
export * from '@testing-library/react'
export { customRender as render }

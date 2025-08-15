import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  children: React.ReactNode
}

export const RouteErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="container py-8">
          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl">
            <div className="card-body">
              <h2 className="card-title text-2xl text-error mb-4">
                ⚠️ Fehler beim Laden der Seite
              </h2>
              <p className="text-base-content/70 mb-6">
                Die angeforderte Seite konnte nicht geladen werden. Bitte versuchen Sie es später erneut.
              </p>
              <div className="card-actions">
                <button
                  onClick={() => window.location.href = '/'}
                  className="btn btn-primary"
                >
                  Zur Startseite
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

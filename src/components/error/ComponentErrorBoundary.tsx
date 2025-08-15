import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  name?: string
}

export const ComponentErrorBoundary: React.FC<Props> = ({ children, name }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <h3 className="font-medium text-error">
                Fehler in {name || 'Komponente'}
              </h3>
              <p className="text-sm text-base-content/70">
                Diese Komponente konnte nicht geladen werden. Der Rest der Seite funktioniert weiterhin.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

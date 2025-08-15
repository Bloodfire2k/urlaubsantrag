import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-2xl max-w-lg w-full">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              
              <h2 className="card-title text-2xl justify-center mb-2">
                Oops! Ein Fehler ist aufgetreten
              </h2>
              
              <p className="text-base-content/70 mb-6">
                Es tut uns leid, aber etwas ist schiefgelaufen. Bitte laden Sie die Seite neu oder kontaktieren Sie den Support, falls das Problem weiterhin besteht.
              </p>

              <div className="space-y-4">
                <button
                  onClick={this.handleReload}
                  className="btn btn-primary btn-block"
                >
                  Seite neu laden
                </button>

                {process.env.NODE_ENV === 'development' && (
                  <div className="text-left p-4 bg-base-200 rounded-lg overflow-auto">
                    <pre className="text-sm">
                      {this.state.error?.toString()}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

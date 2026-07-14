import React from 'react'
import { AlertOctagon, RefreshCcw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
          <div className="card max-w-lg w-full p-8 text-center shadow-2xl border border-red-100 dark:border-red-900/30">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon size={40} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Oops! Something went wrong.</h1>
            <p className="text-gray-500 font-medium mb-8">
              We encountered an unexpected error while loading this component. Our team has been notified.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary w-full h-14 flex items-center justify-center gap-2 text-lg shadow-xl shadow-primary/30"
            >
              <RefreshCcw size={20} /> Reload Page
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-left bg-gray-100 dark:bg-black/40 p-4 rounded-xl overflow-auto text-xs text-red-500 max-h-48">
                <p className="font-bold mb-2">{this.state.error?.toString()}</p>
                <pre>{this.state.error?.stack}</pre>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

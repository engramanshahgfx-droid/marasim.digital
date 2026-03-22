// Reusable Error Boundary Component
// Location: src/components/error/ErrorBoundary.tsx

'use client'

import React, { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-center">
              <h2 className="mb-2 text-lg font-bold text-red-900">Something went wrong</h2>
              <p className="mb-4 text-sm text-red-700">{this.state.error?.message}</p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

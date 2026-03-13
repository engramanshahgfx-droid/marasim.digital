'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="mb-2 text-4xl font-extrabold text-gray-900">Oops!</h1>
          <p className="mb-2 text-xl text-gray-700">Something went wrong</p>
          <p className="mb-8 text-gray-600">
            We are sorry for the inconvenience. Please try again or contact support if the problem persists.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 rounded-lg border border-red-200 bg-white p-4 text-left">
              <p className="break-all font-mono text-sm text-red-600">{error.message || 'An unknown error occurred'}</p>
              {error.digest && <p className="mt-2 text-xs text-gray-500">Error ID: {error.digest}</p>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => reset()}
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="block w-full rounded-lg bg-gray-200 px-4 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-300"
            >
              Go to Home
            </Link>
          </div>

          {/* Support Link */}
          <p className="mt-8 text-sm text-gray-600">
            Need help?{' '}
            <a href="mailto:support@marasim.digital" className="font-medium text-red-600 hover:text-red-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

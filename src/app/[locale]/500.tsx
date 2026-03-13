import Link from 'next/link'

export const metadata = {
  title: 'Server Error',
  description: 'An internal server error occurred',
}

export default function ServerErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 2h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Error Code & Message */}
          <h1 className="mb-2 text-5xl font-extrabold text-orange-600">500</h1>
          <p className="mb-2 text-2xl font-bold text-gray-900">Internal Server Error</p>
          <p className="mb-8 text-gray-700">
            Something went wrong on our end. Our team has been notified and is working to fix it.
          </p>

          {/* Status Indicator */}
          <div className="mb-8 rounded-lg border border-orange-200 bg-white p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-orange-600" />
              <p className="text-sm text-gray-600">We are investigating this issue</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700"
            >
              Refresh Page
            </button>
            <Link
              href="/"
              className="block w-full rounded-lg bg-gray-200 px-4 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-300"
            >
              Go to Home
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 space-y-2 text-sm text-gray-600">
            <p>If the problem persists, please:</p>
            <ul className="space-y-1">
              <li>• Clear your browser cache</li>
              <li>• Try again in a few minutes</li>
              <li>• Contact support@marasim.digital</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

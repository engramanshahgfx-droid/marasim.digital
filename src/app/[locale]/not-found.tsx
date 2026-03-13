import Link from 'next/link'

export const metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Error Code */}
          <h1 className="mb-2 text-5xl font-extrabold text-purple-600">404</h1>
          <p className="mb-2 text-2xl font-bold text-gray-900">Page Not Found</p>
          <p className="mb-8 text-gray-700">
            We could not find the page you are looking for. It might have been moved or deleted.
          </p>

          {/* Helpful Message */}
          <div className="mb-8 rounded-lg border border-purple-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              <strong>Did you mean to:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Check the URL spelling</li>
              <li>• Return to home page</li>
              <li>• Use the search feature</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full rounded-lg bg-purple-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-purple-700"
            >
              Go to Home
            </Link>
            <Link
              href="/"
              className="block w-full rounded-lg bg-gray-200 px-4 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-300"
            >
              Go Back
            </Link>
          </div>

          {/* Additional Help */}
          <p className="mt-8 text-sm text-gray-600">
            Still need help?{' '}
            <a href="mailto:support@marasim.digital" className="font-medium text-purple-600 hover:text-purple-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

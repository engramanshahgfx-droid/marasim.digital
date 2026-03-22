import Link from 'next/link'

export const metadata = {
  title: 'Server Error - Marasim',
  description: 'An internal server error occurred',
}

export default function ServerErrorPage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const isArabic = locale === 'ar'

  const title = isArabic ? 'خطأ في الخادم' : '500 - Internal Server Error'
  const message = isArabic
    ? 'نعتذر، حدث خطأ في الخادم. فريقنا قد تم إخطاره ويعمل على حل المشكلة.'
    : "We're sorry! Our server encountered an error. Our team has been notified and is working to fix it."
  const refreshText = isArabic ? 'إعادة تحميل الصفحة' : 'Refresh Page'
  const goHomeText = isArabic ? 'العودة للرئيسية' : 'Go Home'
  const contactText = isArabic ? 'تواصل مع الدعم' : 'Contact Support'
  const investigatingText = isArabic ? 'نحن نحقق في هذه المسألة' : 'We are investigating this issue'
  const monitoringText = isArabic ? 'جاري المراقبة' : 'Monitoring'

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4 py-12 sm:px-6 lg:px-8 ${
        isArabic ? 'rtl' : 'ltr'
      }`}
    >
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 4v2M6.343 3.665c.886-.887 2.318-.887 3.203 0l9.759 9.759c.887.886.887 2.318 0 3.203l-9.759 9.759c-.885.887-2.317.887-3.203 0L3.14 16.168c-.887-.885-.887-2.317 0-3.203L6.343 3.665z"
              />
            </svg>
          </div>

          {/* Error Code & Message */}
          <h1 className="mb-2 text-5xl font-extrabold text-orange-600">500</h1>
          <p className="mb-2 text-2xl font-bold text-gray-900">{title}</p>
          <p className="mb-8 text-gray-700">{message}</p>

          {/* Status Indicator */}
          <div className="mb-8 rounded-lg border border-orange-200 bg-white p-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-orange-600"></div>
              <p className="text-sm text-gray-600">{investigatingText}</p>
            </div>
            <p className="mt-2 text-xs text-orange-700">{monitoringText}</p>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-lg bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700"
            >
              {refreshText}
            </button>
            <Link
              href={`/${locale}`}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-300"
            >
              {goHomeText}
            </Link>
          </div>

          {/* Support Contact */}
          <div className="mt-6">
            <Link
              href={`/${locale}/contact`}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              {contactText} →
            </Link>
          </div>

          {/* Error Reference */}
          <p className="text-xs text-gray-400 mt-6">
            {isArabic ? 'رقم المرجع: ' : 'Error Reference: '}
            <code className="font-mono text-gray-500">ERR_500_{Date.now()}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
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

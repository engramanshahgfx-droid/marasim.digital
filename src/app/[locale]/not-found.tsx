import Link from 'next/link'

export const metadata = {
  title: 'Page Not Found - Marasim',
  description: 'The page you are looking for does not exist',
}

export default function NotFound({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const isArabic = locale === 'ar'

  const title = isArabic ? 'الصفحة غير موجودة' : '404 - Page Not Found'
  const message = isArabic
    ? 'للأسف، الصفحة التي تبحث عنها غير موجودة. قد تكون قد نُقلت أو حُذفت.'
    : 'We could not find the page you are looking for. It might have been moved or deleted.'
  const goHomeText = isArabic ? 'العودة للرئيسية' : 'Go to Home'
  const exploreText = isArabic ? 'استكشف الخدمات' : 'Browse Marketplace'
  const helpfulText = isArabic ? 'روابط مفيدة:' : 'Helpful links:'
  const contactText = isArabic ? 'تواصل معنا' : 'Contact Us'
  const featuresText = isArabic ? 'المميزات' : 'Features'
  const pricingText = isArabic ? 'التسعير' : 'Pricing'

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 px-4 py-12 sm:px-6 lg:px-8 ${
        isArabic ? 'rtl' : 'ltr'
      }`}
    >
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Error Icon & Code */}
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
          <p className="mb-2 text-2xl font-bold text-gray-900">{title}</p>
          <p className="mb-8 text-gray-700">{message}</p>

          {/* Helpful Suggestions */}
          <div className="mb-8 rounded-lg border border-purple-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-600">{isArabic ? 'ربما تقصد:' : 'Did you mean to:'}</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>{isArabic ? '• التحقق من تهجئة العنوان' : '• Check the URL spelling'}</li>
              <li>{isArabic ? '• العودة إلى الصفحة الرئيسية' : '• Return to home page'}</li>
              <li>{isArabic ? '• استخدام ميزة البحث' : '• Use the search feature'}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className={`mb-8 flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Link
              href={`/${locale}`}
              className="flex-1 rounded-lg bg-purple-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-purple-700"
            >
              {goHomeText}
            </Link>
            <Link
              href={`/${locale}/marketplace`}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-indigo-700"
            >
              {exploreText}
            </Link>
          </div>

          {/* Helpful Links */}
          <div>
            <p className="mb-3 text-xs font-semibold text-gray-600">{helpfulText}</p>
            <div className={`flex flex-wrap justify-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Link href={`/${locale}/contact`} className="text-sm text-purple-600 hover:text-purple-700">
                {contactText}
              </Link>
              <span className="text-gray-400">•</span>
              <Link href={`/${locale}/features`} className="text-sm text-purple-600 hover:text-purple-700">
                {featuresText}
              </Link>
              <span className="text-gray-400">•</span>
              <Link href={`/${locale}/pricing`} className="text-sm text-purple-600 hover:text-purple-700">
                {pricingText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Marketplace-Specific Error Page - Service Not Found
// Location: src/app/[locale]/marketplace/[serviceId]/not-found.tsx

import Link from 'next/link'

export const metadata = {
  title: 'Service Not Found - Marasim Marketplace',
}

export default function ServiceNotFound({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const isArabic = locale === 'ar'

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 ${
        isArabic ? 'rtl' : 'ltr'
      }`}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
        <div className="mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 11-1.414-1.414l2.414-2.414A1 1 0 0013.414 13H10.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 11-1.414-1.414l2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {isArabic ? 'الخدمة غير موجودة' : 'Service Not Found'}
        </h1>
        <p className="mb-6 text-gray-600">
          {isArabic
            ? 'للأسف، الخدمة التي تبحث عنها غير متوفرة حالياً.'
            : "Sorry, we couldn't find the service you're looking for."}
        </p>

        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Link
            href={`/${locale}/marketplace`}
            className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition duration-200 hover:bg-blue-700"
          >
            {isArabic ? 'استكشف الخدمات' : 'Browse Services'}
          </Link>
          <Link
            href={`/${locale}`}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-900 transition duration-200 hover:bg-gray-300"
          >
            {isArabic ? 'الرئيسية' : 'Home'}
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          {isArabic ? 'نصيحة: جرب البحث بكلمات مفتاحية أخرى' : 'Tip: Try searching with different keywords'}
        </p>
      </div>
    </div>
  )
}

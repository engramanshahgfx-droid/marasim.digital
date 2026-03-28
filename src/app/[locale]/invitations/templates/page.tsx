'use client'

import Header from '@/components/common/Header'
import UserAuthGuard from '@/components/UserAuthGuard'
import { TEMPLATE_CATEGORIES } from '@/types/invitations'
import { useLocale } from 'next-intl'
import Link from 'next/link'

export default function TemplateSelectionPage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const rtl = isArabic

  const categories = Object.values(TEMPLATE_CATEGORIES)

  return (
    <UserAuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />

        <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href={`/${locale}/event-management-dashboard`}
            className="mb-8 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <span>← {isArabic ? 'العودة' : 'Back'}</span>
          </Link>

          {/* Header */}
          <div className="mb-12 space-y-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              {isArabic ? 'اختر فئة الدعوة' : 'Select Invitation Category'}
            </h1>
            <p className="text-xl text-gray-600">
              {isArabic
                ? 'اختر نوع الفعالية لتصفح القوالب المناسبة'
                : 'Choose your event type to browse suitable templates'}
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/invitations/templates/${category.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
              >
                {/* Background Gradient */}
                <div
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-75"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />

                {/* Content */}
                <div className="relative space-y-4 p-8">
                  {/* Emoji/Icon */}
                  <div className="text-6xl">{category.emoji}</div>

                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{isArabic ? category.name_ar : category.name}</h2>
                    <p className="mt-2 text-gray-600">{isArabic ? category.description_ar : category.description}</p>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex justify-end pt-4">
                    <div className="rounded-full bg-white p-3 text-gray-900 transition-transform group-hover:translate-x-1">
                      {rtl ? '←' : '→'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-16 rounded-lg bg-blue-50 p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">{isArabic ? 'نصيحة' : 'Tip'}</h3>
            <p className="text-blue-700">
              {isArabic
                ? 'يمكنك تغيير نمط القالب والألوان والنصوص بعد اختياره'
                : 'You can customize colors, fonts, and text after selecting a template'}
            </p>
          </div>
        </main>
      </div>
    </UserAuthGuard>
  )
}

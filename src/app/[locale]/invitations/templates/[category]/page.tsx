'use client'

import Header from '@/components/common/Header'
import UserAuthGuard from '@/components/UserAuthGuard'
import TemplateBrowser from '@/components/invitations/TemplateBrowser'
import { TemplateCategory as TemplateCategoryType, TEMPLATE_CATEGORIES } from '@/types/invitations'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, use } from 'react'

interface TemplateCategoryPageProps {
  params: Promise<{
    category: string
    locale: string
  }>
}

/** Inner component that safely uses useSearchParams inside Suspense */
function CategoryPageInner({
  category,
}: {
  category: string
}) {
  const currentLocale = useLocale()
  const isArabic = currentLocale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  const categoryInfo = TEMPLATE_CATEGORIES[category as TemplateCategoryType]

  if (!categoryInfo) {
    return (
      <main className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-600">
          {isArabic ? 'فئة غير صحيحة' : 'Invalid category'}
        </p>
        <Link
          href={`/${currentLocale}/invitations/templates`}
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
        >
          {isArabic ? 'العودة للفئات' : 'Back to categories'}
        </Link>
      </main>
    )
  }

  const handleSelectTemplate = (templateId: string) => {
    const queryString = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
    router.push(`/${currentLocale}/invitations/templates/${category}/${templateId}/customize${queryString}`)
  }

  return (
    <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-sm text-gray-600">
        <Link href={`/${currentLocale}/event-management-dashboard`} className="hover:text-blue-600">
          {isArabic ? 'لوحة التحكم' : 'Dashboard'}
        </Link>
        <span>/</span>
        <Link href={`/${currentLocale}/invitations/templates`} className="hover:text-blue-600">
          {isArabic ? 'القوالب' : 'Templates'}
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">
          {isArabic ? categoryInfo.name_ar : categoryInfo.name}
        </span>
      </div>

      {/* Page Header */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{categoryInfo.emoji}</span>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {isArabic
                ? `اختر قالب دعوة ${categoryInfo.name_ar}`
                : `Choose Your ${categoryInfo.name} Invitation Template`}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {eventId
                ? isArabic
                  ? 'اختر من التصاميم المناسبة لهذا النوع، وسيتم تعبئة بيانات الفعالية تلقائياً في الخطوة التالية.'
                  : 'Choose from designs curated for this event type. Your event details will be filled in automatically on the next step.'
                : isArabic
                  ? categoryInfo.description_ar
                  : categoryInfo.description}
            </p>
          </div>
        </div>
      </div>

      <TemplateBrowser
        category={category as TemplateCategoryType}
        eventId={eventId}
        onSelectTemplate={handleSelectTemplate}
      />
    </main>
  )
}

export default function TemplateCategoryPage({ params }: TemplateCategoryPageProps) {
  const { category } = use(params)

  return (
    <UserAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
            </div>
          }
        >
          <CategoryPageInner category={category} />
        </Suspense>
      </div>
    </UserAuthGuard>
  )
}

'use client'

import Header from '@/components/common/Header'
import UserAuthGuard from '@/components/UserAuthGuard'
import { getCurrentSession } from '@/lib/auth'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const CATEGORIES = [
  { value: 'Invitations & Designs', en: 'Invitations & Designs', ar: 'الدعوات والتصاميم' },
  { value: 'Gifts & Favors', en: 'Gifts & Favors', ar: 'الهدايا والتذكارات' },
  { value: 'Flowers & Decorations', en: 'Flowers & Decorations', ar: 'الزهور والديكورات' },
  { value: 'Catering & Food', en: 'Catering & Food', ar: 'الطعام والضيافة' },
  { value: 'Photography & Video', en: 'Photography & Video', ar: 'التصوير والفيديو' },
  { value: 'Venues', en: 'Venues', ar: 'الأماكن' },
  { value: 'Clothing & Beauty', en: 'Clothing & Beauty', ar: 'الملابس والتجميل' },
  { value: 'Additional Services', en: 'Additional Services', ar: 'خدمات إضافية' },
]

export default function BecomeProviderPage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const router = useRouter()

  const [form, setForm] = useState({
    business_name: '',
    email: '',
    phone: '',
    category: '',
    business_description: '',
    website_url: '',
    instagram: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.business_name || !form.email || !form.phone || !form.category) {
      setError(
        isArabic
          ? 'يرجى ملء جميع الحقول المطلوبة'
          : 'Please fill in all required fields'
      )
      return
    }

    setLoading(true)
    try {
      const session = await getCurrentSession()
      if (!session?.access_token) {
        setError(isArabic ? 'يرجى تسجيل الدخول أولاً' : 'Please sign in first')
        setLoading(false)
        return
      }

      const body: Record<string, string> = {
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        category: form.category,
      }
      if (form.business_description) body.business_description = form.business_description
      if (form.website_url) body.website_url = form.website_url
      if (form.instagram) {
        body.social_media = JSON.stringify({ instagram: form.instagram })
      }

      const res = await fetch('/api/marketplace/providers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
      } else if (res.status === 409) {
        setError(
          isArabic
            ? 'أنت مسجل بالفعل كمزود خدمة'
            : 'You are already registered as a provider'
        )
      } else {
        setError(data.message || (isArabic ? 'حدث خطأ. يرجى المحاولة مجدداً' : 'An error occurred. Please try again.'))
      }
    } catch {
      setError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {isArabic ? 'تم التسجيل بنجاح!' : 'Registration Submitted!'}
            </h2>
            <p className="mb-6 text-gray-500">
              {isArabic
                ? 'سيتم مراجعة طلبك والتواصل معك خلال 24-48 ساعة'
                : 'Your application will be reviewed and you will be contacted within 24–48 hours'}
            </p>
            <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Link
                href={`/${locale}/marketplace`}
                className="flex-1 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700"
              >
                {isArabic ? 'تصفح السوق' : 'Browse Marketplace'}
              </Link>
              <Link
                href={`/${locale}/event-management-dashboard`}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                {isArabic ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <UserAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto max-w-2xl px-4 pb-16 pt-28 sm:px-6">
          {/* Header */}
          <div className={`mb-8 ${isArabic ? 'text-right' : ''}`}>
            <nav className={`mb-4 flex items-center gap-2 text-sm text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Link href={`/${locale}/marketplace`} className="hover:text-purple-600">
                {isArabic ? 'السوق' : 'Marketplace'}
              </Link>
              <span>/</span>
              <span className="text-gray-900">{isArabic ? 'التسجيل كمزود خدمة' : 'Become a Provider'}</span>
            </nav>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              {isArabic ? 'سجّل كمزود خدمة' : 'Register as a Provider'}
            </h1>
            <p className="text-gray-500">
              {isArabic
                ? 'انضم إلى سوق مراسم وابدأ بتقديم خدماتك لآلاف العملاء'
                : 'Join Marasim Marketplace and start offering your services to thousands of customers'}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-8 shadow-sm"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {/* Business Name */}
            <div className="mb-5">
              <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'اسم النشاط التجاري *' : 'Business Name *'}
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder={isArabic ? 'مثال: استوديو الذكريات' : 'e.g. Memories Studio'}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'فئة الخدمة *' : 'Service Category *'}
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">
                  {isArabic ? 'اختر فئة الخدمة' : 'Select a category'}
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {isArabic ? cat.ar : cat.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'البريد الإلكتروني *' : 'Email *'}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="business@example.com"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'رقم الهاتف *' : 'Phone Number *'}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+966 5X XXX XXXX"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'وصف النشاط التجاري' : 'Business Description'}
              </label>
              <textarea
                value={form.business_description}
                onChange={(e) => handleChange('business_description', e.target.value)}
                rows={4}
                placeholder={
                  isArabic
                    ? 'اكتب نبذة عن نشاطك التجاري وخدماتك...'
                    : 'Tell us about your business and services...'
                }
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Website */}
            <div className="mb-5">
              <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'الموقع الإلكتروني' : 'Website (optional)'}
              </label>
              <input
                type="url"
                value={form.website_url}
                onChange={(e) => handleChange('website_url', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Instagram */}
            <div className="mb-8">
              <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${isArabic ? 'text-right' : ''}`}>
                {isArabic ? 'إنستغرام' : 'Instagram (optional)'}
              </label>
              <div className={`flex overflow-hidden rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-purple-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="flex items-center bg-gray-100 px-3 text-sm text-gray-500">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder={isArabic ? 'اسم الحساب' : 'username'}
                  className="flex-1 px-3 py-3 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Terms note */}
            <p className={`mb-5 text-xs text-gray-400 ${isArabic ? 'text-right' : ''}`}>
              {isArabic
                ? "بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمراسم"
                : "By registering, you agree to Marasim Terms of Service and Privacy Policy"}
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
            >
              {loading
                ? (isArabic ? 'جاري التسجيل...' : 'Registering...')
                : (isArabic ? 'تقديم الطلب' : 'Submit Application')}
            </button>
          </form>
        </main>
      </div>
    </UserAuthGuard>
  )
}

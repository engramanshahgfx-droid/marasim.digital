'use client'

import LocaleSwitch from '@/components/common/LocaleSwitch'
import { getCurrentUser } from '@/lib/auth'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const features = [
  {
    icon: '📩',
    title: { en: 'Digital Invitations', ar: 'دعوات رقمية' },
    description: {
      en: 'Create beautiful digital invitations and send them via WhatsApp instantly.',
      ar: 'أنشئ دعوات رقمية أنيقة وأرسلها عبر واتساب بشكل فوري.',
    },
  },
  {
    icon: '📋',
    title: { en: 'Guest Management', ar: 'إدارة الضيوف' },
    description: {
      en: 'Upload guest lists, track RSVPs, and manage responses in real-time.',
      ar: 'ارفع قوائم الضيوف، وتابع الردود، وأدر الاستجابات بشكل مباشر.',
    },
  },
  {
    icon: '📱',
    title: { en: 'QR Check-in', ar: 'تسجيل حضور QR' },
    description: {
      en: 'Generate unique QR codes for each guest and track attendance live.',
      ar: 'أنشئ رمز QR فريد لكل ضيف وتابع الحضور لحظة بلحظة.',
    },
  },
  {
    icon: '📊',
    title: { en: 'Analytics & Reports', ar: 'التحليلات والتقارير' },
    description: {
      en: 'Get detailed reports on invitations sent, RSVPs, and attendance rates.',
      ar: 'احصل على تقارير مفصلة عن الدعوات المرسلة والردود ونسب الحضور.',
    },
  },
  {
    icon: '🌐',
    title: { en: 'Bilingual Support', ar: 'دعم ثنائي اللغة' },
    description: {
      en: 'Full Arabic and English support for invitations and dashboard.',
      ar: 'دعم كامل للعربية والإنجليزية في الدعوات ولوحة التحكم.',
    },
  },
  {
    icon: '🔒',
    title: { en: 'Secure & Reliable', ar: 'آمن وموثوق' },
    description: {
      en: 'Enterprise-grade security with Supabase and Stripe payment processing.',
      ar: 'أمان موثوق بمعايير احترافية مع Supabase ومعالجة مدفوعات Stripe.',
    },
  },
]

const steps = [
  {
    number: '1',
    title: { en: 'Create Your Event', ar: 'أنشئ فعاليتك' },
    description: {
      en: 'Set up your event details — name, date, venue, and invitation template.',
      ar: 'أدخل تفاصيل الفعالية مثل الاسم والتاريخ والمكان وقالب الدعوة.',
    },
  },
  {
    number: '2',
    title: { en: 'Add Your Guests', ar: 'أضف ضيوفك' },
    description: {
      en: 'Upload your guest list via CSV/Excel or add them manually.',
      ar: 'ارفع قائمة الضيوف عبر CSV أو Excel أو أضفهم يدويًا.',
    },
  },
  {
    number: '3',
    title: { en: 'Send & Track', ar: 'أرسل وتابع' },
    description: {
      en: 'Send WhatsApp invitations and track RSVPs and attendance in real-time.',
      ar: 'أرسل دعوات واتساب وتابع الردود والحضور بشكل مباشر.',
    },
  },
]

const plans = [
  {
    name: { en: 'Basic', ar: 'الأساسية' },
    price: '$29.99',
    period: { en: '/month', ar: '/شهريًا' },
    color: 'bg-green-500',
    features: {
      en: ['1 Event', '200 Guests', '1,000 WhatsApp Messages', 'QR Codes', 'Basic Reports'],
      ar: ['فعالية واحدة', '200 ضيف', '1000 رسالة واتساب', 'رموز QR', 'تقارير أساسية'],
    },
  },
  {
    name: { en: 'Pro', ar: 'الاحترافية' },
    price: '$99.99',
    period: { en: '/month', ar: '/شهريًا' },
    color: 'bg-blue-600',
    popular: true,
    features: {
      en: ['5 Events', '1,000 Guests', '5,000 WhatsApp Messages', 'Advanced Reports', 'Excel Export'],
      ar: ['5 فعاليات', '1000 ضيف', '5000 رسالة واتساب', 'تقارير متقدمة', 'تصدير Excel'],
    },
  },
  {
    name: { en: 'Enterprise', ar: 'المؤسسات' },
    price: '$299.99',
    period: { en: '/month', ar: '/شهريًا' },
    color: 'bg-purple-600',
    features: {
      en: ['Unlimited Events', 'Unlimited Guests', 'Unlimited Messages', 'Priority Support', 'Custom Branding'],
      ar: ['فعاليات غير محدودة', 'ضيوف غير محدودين', 'رسائل غير محدودة', 'دعم أولوية', 'هوية مخصصة'],
    },
  },
]

export default function HomePage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const router = useRouter()

  const content = {
    navFeatures: isArabic ? 'المميزات' : 'Features',
    navHowItWorks: isArabic ? 'كيف يعمل' : 'How it Works',
    navPricing: isArabic ? 'الأسعار' : 'Pricing',
    signIn: isArabic ? 'تسجيل الدخول' : 'Sign In',
    createInvitation: isArabic ? 'إنشاء دعوة' : 'Create Invitation',
    heroBadge: isArabic ? 'ابدأ مجانًا، بدون بطاقة ائتمان' : 'Start Free — No Credit Card Required',
    heroTitlePrefix: isArabic ? 'أنشئ دعوات رقمية' : 'Create Digital Invitations',
    heroTitleAccent: isArabic ? 'بسهولة' : 'Easily',
    heroDescription: isArabic
      ? 'أدر فعالياتك، وأرسل دعوات واتساب، وتابع الردود، ونظم تسجيل الحضور عبر QR من منصة واحدة.'
      : 'Manage events, send WhatsApp invitations, track RSVPs, and handle QR check-ins — all from one powerful platform.',
    heroSecondaryCta: isArabic ? 'شاهد كيف يعمل' : 'See How it Works',
    dashboardUrl: 'marasim.digital/dashboard',
    guestsInvited: isArabic ? 'تمت دعوته' : 'Guests Invited',
    confirmed: isArabic ? 'مؤكد' : 'Confirmed',
    checkedIn: isArabic ? 'تم تسجيل حضوره' : 'Checked In',
    weeklyActivity: isArabic ? 'النشاط الأسبوعي للدعوات' : 'Weekly Invitation Activity',
    howItWorksTitle: isArabic ? 'كيف يعمل' : 'How It Works',
    howItWorksDescription: isArabic ? 'ابدأ في 3 خطوات بسيطة' : 'Get started in 3 simple steps',
    featuresTitle: isArabic ? 'كل ما تحتاجه' : 'Everything You Need',
    featuresDescription: isArabic
      ? 'أدوات قوية لإدارة فعالياتك من البداية إلى النهاية'
      : 'Powerful tools to manage your events from start to finish',
    pricingTitle: isArabic ? 'أسعار بسيطة وواضحة' : 'Simple, Transparent Pricing',
    pricingDescription: isArabic
      ? 'ابدأ مجانًا وقم بالترقية عندما تكون جاهزًا'
      : "Start free, upgrade when you're ready",
    mostPopular: isArabic ? 'الأكثر شيوعًا' : 'MOST POPULAR',
    getStarted: isArabic ? 'ابدأ الآن' : 'Get Started',
    ctaTitle: isArabic ? 'جاهز لتبسيط إدارة فعالياتك؟' : 'Ready to Simplify Your Event Management?',
    ctaDescription: isArabic
      ? 'انضم إلى منظمي الفعاليات الذين يستخدمون Marasim لإنشاء دعوات رقمية مميزة.'
      : 'Join thousands of event organizers who use Marasim to create stunning digital invitations.',
    ctaButton: isArabic ? 'أنشئ دعوتك' : 'Create Your Invitation',
    footerNote: isArabic
      ? 'لا حاجة إلى بطاقة ائتمان · توجد خطة مجانية'
      : 'No credit card required · Free plan available',
    footerRights: isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.',
  }

  useEffect(() => {
    const redirectIfAuthenticated = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          router.replace(`/${locale}/event-management-dashboard`)
        }
      } catch {
        // ignore unauthenticated state
      }
    }

    redirectIfAuthenticated()
  }, [locale, router])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
                <img src="/logo.png" alt="Marasim Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold text-gray-900">Marasim</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
                {content.navFeatures}
              </a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
                {content.navHowItWorks}
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
                {content.navPricing}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <LocaleSwitch />
              <Link
                href={`/${locale}/auth/login`}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {content.signIn}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {content.createInvitation}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            ✨ {content.heroBadge}
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
            {content.heroTitlePrefix} <span className="text-blue-600">{content.heroTitleAccent}</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">{content.heroDescription}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/auth/register`}
              className="w-full rounded-lg bg-blue-600 px-8 py-3.5 text-center font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
            >
              {content.createInvitation} →
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-lg border border-gray-300 px-8 py-3.5 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              {content.heroSecondaryCta}
            </a>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-16">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-2xl">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-400">{content.dashboardUrl}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">248</div>
                    <div className="text-sm text-gray-500">{content.guestsInvited}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">186</div>
                    <div className="text-sm text-gray-500">{content.confirmed}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">142</div>
                    <div className="text-sm text-gray-500">{content.checkedIn}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex h-32 items-end justify-around gap-2">
                    {[40, 65, 85, 70, 90, 75, 95].map((h, i) => (
                      <div key={i} className="w-full rounded-t-md bg-blue-500" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-400">{content.weeklyActivity}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">{content.howItWorksTitle}</h2>
            <p className="text-lg text-gray-600">{content.howItWorksDescription}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">{step.title[locale as 'en' | 'ar']}</h3>
                <p className="text-gray-600">{step.description[locale as 'en' | 'ar']}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">{content.featuresTitle}</h2>
            <p className="text-lg text-gray-600">{content.featuresDescription}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title.en}
                className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title[locale as 'en' | 'ar']}</h3>
                <p className="text-sm text-gray-600">{feature.description[locale as 'en' | 'ar']}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">{content.pricingTitle}</h2>
            <p className="text-lg text-gray-600">{content.pricingDescription}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name.en}
                className={`overflow-hidden rounded-xl border-2 bg-white ${
                  plan.popular ? 'relative border-blue-600 shadow-xl' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-600 py-1.5 text-center text-xs font-bold text-white">
                    {content.mostPopular}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name[locale as 'en' | 'ar']}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="ml-1 text-gray-500">{plan.period[locale as 'en' | 'ar']}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features[locale as 'en' | 'ar'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/${locale}/auth/register`}
                    className={`mt-6 block rounded-lg py-2.5 text-center font-medium transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {content.getStarted}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">{content.ctaTitle}</h2>
          <p className="mb-8 text-lg text-gray-600">{content.ctaDescription}</p>
          <Link
            href={`/${locale}/auth/register`}
            className="inline-block rounded-lg bg-blue-600 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {content.ctaButton} →
          </Link>
          <p className="mt-4 text-sm text-gray-500">{content.footerNote}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden">
              <img src="/logo.png" alt="Marasim Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold text-white">Marasim</span>
          </div>

          <p className="text-sm">
            © {new Date().getFullYear()} Marasim. {content.footerRights}
          </p>
        </div>
      </footer>
    </div>
  )
}

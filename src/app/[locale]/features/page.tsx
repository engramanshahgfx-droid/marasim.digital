import LocaleSwitch from '@/components/common/LocaleSwitch'
import Link from 'next/link'

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isArabic = locale === 'ar'

  const content = {
    title: isArabic ? 'مميزات قوية' : 'Powerful Features',
    description: isArabic
      ? 'كل ما تحتاجه لإدارة الدعوات بسهولة'
      : 'Everything you need to manage invitations effortlessly',
    ctaTitle: isArabic ? 'جاهز للبدء؟' : 'Ready to get started?',
    ctaDescription: isArabic ? 'أنشئ أول دعوة لك اليوم' : 'Create your first invitation today!',
    ctaButton: isArabic ? 'سجّل مجانًا' : 'Sign Up Free',
    features: [
      {
        icon: '🎉',
        title: isArabic ? 'إدارة الفعاليات' : 'Event Management',
        description: isArabic
          ? 'أنشئ وأدر فعالياتك مع كل التفاصيل في مكان واحد.'
          : 'Create and manage unlimited events with all details in one place.',
      },
      {
        icon: '👥',
        title: isArabic ? 'قوائم الضيوف' : 'Guest Lists',
        description: isArabic
          ? 'أضف الضيوف وتابع الردود وأدر الحضور بسهولة.'
          : 'Add guests, track RSVPs, and manage attendance effortlessly.',
      },
      {
        icon: '📱',
        title: isArabic ? 'دعوات واتساب' : 'WhatsApp Invitations',
        description: isArabic
          ? 'أرسل دعوات جميلة عبر واتساب مباشرة للضيوف.'
          : 'Send beautiful invitations via WhatsApp directly to guests.',
      },
      {
        icon: '🎟️',
        title: isArabic ? 'تسجيل حضور QR' : 'QR Code Check-in',
        description: isArabic
          ? 'تسجيل حضور سريع عبر QR مع متابعة فورية للحضور.'
          : 'Fast check-in using QR codes. Real-time attendance tracking.',
      },
      {
        icon: '📊',
        title: isArabic ? 'التحليلات والتقارير' : 'Analytics & Reports',
        description: isArabic
          ? 'اطلع على تقارير الحضور وإحصائيات الضيوف بالتفصيل.'
          : 'View detailed attendance reports and guest statistics.',
      },
      {
        icon: '🎨',
        title: isArabic ? 'قوالب مخصصة' : 'Custom Templates',
        description: isArabic
          ? 'صمّم دعوات أنيقة بهويتك الخاصة.'
          : 'Design beautiful invitation templates with your branding.',
      },
      {
        icon: '🌍',
        title: isArabic ? 'تعدد اللغات' : 'Multi-language',
        description: isArabic ? 'دعم كامل للعربية والإنجليزية.' : 'Support for English and Arabic invitations.',
      },
      {
        icon: '📧',
        title: isArabic ? 'إشعارات البريد' : 'Email Notifications',
        description: isArabic
          ? 'تذكيرات ورسائل تأكيد تلقائية عبر البريد الإلكتروني.'
          : 'Automated email reminders and confirmations.',
      },
      {
        icon: '🔒',
        title: isArabic ? 'الأمان' : 'Secure',
        description: isArabic ? 'أمان احترافي لحماية بياناتك.' : 'Enterprise-grade security for your data.',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <div className="mb-8 flex justify-center">
          <LocaleSwitch />
        </div>
        <h1 className="text-5xl font-bold text-gray-900">{content.title}</h1>
        <p className="mt-4 text-xl text-gray-600">{content.description}</p>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {content.features.map((feature, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8">
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold text-white">{content.ctaTitle}</h2>
          <p className="mt-4 text-lg text-blue-100">{content.ctaDescription}</p>
          <Link
            href={`/${locale}/auth/register`}
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 font-bold text-blue-600 hover:bg-blue-50"
          >
            {content.ctaButton}
          </Link>
        </div>
      </div>
    </div>
  )
}

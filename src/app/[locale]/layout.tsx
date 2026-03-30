import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ar' }]
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  const messages = await getMessages()
  const direction = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div lang={locale} dir={direction} className="min-h-screen">
        {children}
      </div>
    </NextIntlClientProvider>
  )
}

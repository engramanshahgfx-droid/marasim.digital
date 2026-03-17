'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

const supportedLocales = ['en', 'ar'] as const

function LocaleSwitch() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === locale) {
      return
    }

    const nextPath = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${nextLocale}`)
    router.push(nextPath === pathname ? `/${nextLocale}` : nextPath)
  }

  const nextLocale = locale === 'en' ? 'ar' : 'en'
  const label = nextLocale === 'en' ? 'EN' : 'ع'

  return (
    <button
      type="button"
      onClick={() => handleLocaleChange(nextLocale)}
      className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 sm:text-sm"
      aria-label="Toggle language"
    >
      {label}
    </button>
  )
}

export default LocaleSwitch

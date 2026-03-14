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

  return (
    <div
      className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
      role="group"
      aria-label="Language switch"
    >
      {supportedLocales.map((supportedLocale) => {
        const isActive = locale === supportedLocale
        const label = supportedLocale === 'en' ? 'EN' : 'ع'

        return (
          <button
            key={supportedLocale}
            type="button"
            onClick={() => handleLocaleChange(supportedLocale)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            aria-pressed={isActive}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default LocaleSwitch

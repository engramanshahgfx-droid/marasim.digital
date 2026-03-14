'use client'

import LocaleSwitch from '@/components/common/LocaleSwitch'
import { getCurrentUser, signInUser } from '@/lib/auth'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const content = {
    signIn: isArabic ? 'تسجيل الدخول' : 'Sign In',
    register: isArabic ? 'إنشاء حساب' : 'Register',
    title: isArabic ? 'سجّل الدخول إلى حسابك' : 'Sign in to your account',
    email: isArabic ? 'البريد الإلكتروني' : 'Email address',
    password: isArabic ? 'كلمة المرور' : 'Password',
    forgotPassword: isArabic ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    loading: isArabic ? 'جارٍ تسجيل الدخول...' : 'Signing in...',
    noAccount: isArabic ? 'ليس لديك حساب؟' : 'Do not have an account?',
    failed: isArabic ? 'فشل تسجيل الدخول' : 'Failed to sign in',
  }

  useEffect(() => {
    const redirectIfAuthenticated = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          router.replace(`/${locale}/event-management-dashboard`)
        }
      } catch (_error) {
        return
      }
    }

    redirectIfAuthenticated()
  }, [locale, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInUser(email, password)

      // Redirect to dashboard after successful login
      router.replace(`/${locale}/event-management-dashboard`)
    } catch (err: any) {
      setError(err.message || content.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Navigation Header */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-blue-600">
                <img src="/logo.png" alt="Marasim Logo" className="h-6 w-6 object-contain" />
              </div>
              <span className="text-lg font-bold text-gray-900 sm:text-xl">Marasim</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <LocaleSwitch />
              <Link
                href={`/${locale}/auth/login`}
                className="px-2 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 sm:px-4 sm:text-sm"
              >
                {content.signIn}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="whitespace-nowrap rounded-lg bg-blue-600 px-2 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 sm:px-4 sm:text-sm"
              >
                {content.register}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 pt-24 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{content.title}</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="sr-only">
                  {content.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder={content.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  {content.password}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder={content.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div></div>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {content.forgotPassword}
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? content.loading : content.signIn}
              </button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">{content.noAccount} </span>
              <Link href={`/${locale}/auth/register`} className="text-blue-600 hover:text-blue-500">
                {content.register}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

'use client'

import LocaleSwitch from '@/components/common/LocaleSwitch'
import { getCurrentUser, sendOTP, verifyOTPAndRegister } from '@/lib/auth'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Step = 'form' | 'otp'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [step, setStep] = useState<Step>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const content = {
    signIn: isArabic ? 'تسجيل الدخول' : 'Sign In',
    register: isArabic ? 'إنشاء حساب' : 'Register',
    createFreeAccount: isArabic ? 'أنشئ حسابك المجاني' : 'Create your free account',
    verifyEmail: isArabic ? 'تحقق من بريدك الإلكتروني' : 'Verify your email',
    startFree: isArabic
      ? 'ابدأ بإنشاء الدعوات فورًا، بدون بطاقة ائتمان'
      : 'Start creating invitations instantly — no credit card required',
    sentCode: (emailAddress: string) =>
      isArabic ? `أرسلنا رمزًا من 6 أرقام إلى ${emailAddress}` : `We sent a 6-digit code to ${emailAddress}`,
    fullName: isArabic ? 'الاسم الكامل' : 'Full Name',
    fullNamePlaceholder: isArabic ? 'اسمك الكامل' : 'Your full name',
    email: isArabic ? 'البريد الإلكتروني' : 'Email address',
    phone: isArabic ? 'رقم الجوال' : 'Phone Number',
    optional: isArabic ? '(اختياري)' : '(optional)',
    sendCode: isArabic ? 'إرسال رمز التحقق' : 'Send Verification Code',
    sendingCode: isArabic ? 'جارٍ إرسال الرمز...' : 'Sending code...',
    hasAccount: isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    freeIncludes: isArabic
      ? 'الحساب المجاني يشمل: فعالية واحدة · 50 ضيفًا · رموز QR · متابعة الردود'
      : 'Free account includes: 1 Event · 50 Guests · QR Codes · RSVP Tracking',
    signInHere: isArabic ? 'سجّل الدخول من هنا ←' : 'Sign in here →',
    verificationCode: isArabic ? 'رمز التحقق' : 'Verification Code',
    verifyCreate: isArabic ? 'تحقق وأنشئ الحساب' : 'Verify & Create Account',
    verifying: isArabic ? 'جارٍ التحقق...' : 'Verifying...',
    changeEmail: isArabic ? 'تغيير البريد الإلكتروني →' : '← Change email',
    resendCode: isArabic ? 'إعادة إرسال الرمز' : 'Resend code',
    failedSend: isArabic ? 'فشل إرسال رمز التحقق' : 'Failed to send verification code',
    invalidCode: isArabic ? 'رمز التحقق غير صالح' : 'Invalid verification code',
    failedResend: isArabic ? 'فشل إعادة إرسال الرمز' : 'Failed to resend code',
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await sendOTP(email)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || content.failedSend)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOTPAndRegister(email, otp, fullName, phone || undefined)
      router.replace(`/${locale}/event-management-dashboard`)
    } catch (err: any) {
      setError(err.message || content.invalidCode)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setLoading(true)
    try {
      await sendOTP(email)
      setError('')
    } catch (err: any) {
      setError(err.message || content.failedResend)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Navigation Header */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href={`/${locale}`} className="flex items-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg">
                <img src="/logo.png" alt="Marasim Logo" className="h-full w-full object-contain" />
              </div>
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
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {step === 'form' ? content.createFreeAccount : content.verifyEmail}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'form' ? content.startFree : content.sentCode(email)}
            </p>
          </div>

          {step === 'form' ? (
            <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    {content.fullName}
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder={content.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {content.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    {content.phone} <span className="text-gray-400">{content.optional}</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="966551234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? content.sendingCode : content.sendCode}
              </button>

              <div className="text-center text-sm">
                <span className="text-gray-600">{content.hasAccount} </span>
                <Link href={`/${locale}/auth/login`} className="text-blue-600 hover:text-blue-500">
                  {content.signIn}
                </Link>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-center text-xs text-blue-700">🎉 {content.freeIncludes}</p>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                  {error.includes('already exists') && (
                    <div className="mt-2">
                      <Link
                        href={`/${locale}/auth/login`}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Sign in here →
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  {content.verificationCode}
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-center font-mono text-2xl tracking-widest placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="text-sm text-gray-600">{content.signInHere}</div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? content.verifying : content.verifyCreate}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep('form')} className="text-gray-500 hover:text-gray-700">
                  {content.changeEmail}
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  {content.resendCode}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

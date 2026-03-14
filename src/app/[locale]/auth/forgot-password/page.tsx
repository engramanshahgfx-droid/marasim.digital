'use client'

import LocaleSwitch from '@/components/common/LocaleSwitch'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const content = {
    signIn: isArabic ? 'تسجيل الدخول' : 'Sign In',
    register: isArabic ? 'إنشاء حساب' : 'Register',
    title: isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset your password',
    email: isArabic ? 'البريد الإلكتروني' : 'Email address',
    emailPlaceholder: isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email',
    sendOtp: isArabic ? 'إرسال الرمز' : 'Send OTP',
    sendingOtp: isArabic ? 'جارٍ إرسال الرمز...' : 'Sending OTP...',
    otp: isArabic ? 'أدخل رمز التحقق' : 'Enter OTP',
    verifyOtp: isArabic ? 'تحقق من الرمز' : 'Verify OTP',
    verifying: isArabic ? 'جارٍ التحقق...' : 'Verifying...',
    otpHint: isArabic ? 'رمز الاختبار: 123456' : 'Fixed OTP: 123456',
    newPassword: isArabic ? 'كلمة المرور الجديدة' : 'New Password',
    newPasswordPlaceholder: isArabic ? 'أدخل كلمة المرور الجديدة' : 'Enter new password',
    confirmPassword: isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password',
    confirmPasswordPlaceholder: isArabic ? 'أكد كلمة المرور' : 'Confirm password',
    resetPassword: isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Password',
    resetting: isArabic ? 'جارٍ إعادة التعيين...' : 'Resetting...',
    backToSignIn: isArabic ? 'العودة إلى تسجيل الدخول →' : '← Back to Sign In',
    failedSend: isArabic ? 'فشل إرسال الرمز' : 'Failed to send OTP',
    invalidOtp: isArabic ? 'رمز التحقق غير صالح' : 'Invalid OTP',
    failedReset: isArabic ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password',
    otpSent: isArabic ? '✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني' : '✅ OTP sent to your email! Use: 123456',
    otpVerified: isArabic
      ? '✅ تم التحقق من الرمز، الآن أدخل كلمة المرور الجديدة'
      : '✅ OTP verified! Now set your new password',
    resetSuccess: isArabic
      ? '✅ تم تغيير كلمة المرور بنجاح، سيتم تحويلك إلى تسجيل الدخول'
      : '✅ Password reset successfully! Redirecting to login...',
    passwordsMismatch: isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
    passwordLength: isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || content.failedSend)
      }

      setMessage(content.otpSent)
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || content.invalidOtp)
      }

      setMessage(content.otpVerified)
      setStep('reset')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError(content.passwordsMismatch)
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError(content.passwordLength)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || content.failedReset)
      }

      setMessage(content.resetSuccess)
      setTimeout(() => {
        router.push(`/${locale}/auth/login`)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
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

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{message}</div>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="mt-8 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {content.email}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder={content.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? content.sendingOtp : content.sendOtp}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  {content.otp}
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  placeholder="123456"
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">{content.otpHint}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? content.verifying : content.verifyOtp}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  {content.newPassword}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder={content.newPasswordPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  {content.confirmPassword}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder={content.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? content.resetting : content.resetPassword}
              </button>
            </form>
          )}

          <div className="text-center text-sm">
            <Link href={`/${locale}/auth/login`} className="font-medium text-blue-600 hover:text-blue-500">
              {content.backToSignIn}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

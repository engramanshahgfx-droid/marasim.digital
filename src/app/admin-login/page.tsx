'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isArabic, setIsArabic] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Verify user is super_admin
      const { data: user, error: userError } = (await supabase
        .from('users')
        .select('role')
        .eq('id', data.user?.id)
        .single()) as any

      if (userError || !user || (user as any)?.role !== 'super_admin') {
        setError('Access denied. Super admin credentials required.')
        return
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={isArabic ? { fontFamily: "'Tajawal', sans-serif" } : {}}
    >
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setIsArabic(!isArabic)}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
            aria-label="Toggle language"
          >
            {isArabic ? 'English' : 'عربي'}
          </button>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">{isArabic ? 'لوحة الإدارة' : 'Admin Panel'}</h1>
            <p className="mt-2 text-gray-600">{isArabic ? 'تسجيل دخول المشرف العام' : 'Super Admin Login'}</p>
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (isArabic ? 'جارٍ تسجيل الدخول...' : 'Logging in...') : isArabic ? 'تسجيل الدخول' : 'Login'}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p>
              ⚠️ <strong>{isArabic ? 'منطقة آمنة:' : 'Secure Area:'}</strong>{' '}
              {isArabic
                ? 'يمكن فقط للمشرفين العامين الوصول إلى هذه اللوحة. يتم تسجيل جميع الأنشطة لأغراض الأمان.'
                : 'Only super admin users can access this panel. All activities are logged for security.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

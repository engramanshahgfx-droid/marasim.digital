'use client'

import { getCurrentUser } from '@/lib/auth'
import { formatDate } from '@/lib/dateUtils'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

const AdminLangCtx = createContext(false)

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [isArabic, setIsArabic] = useState(false)

  useEffect(() => {
    verifyAdmin()
  }, [])

  const verifyAdmin = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/admin-login')
        return
      }

      const { data: adminUser } = (await supabase.from('users').select('*').eq('id', user.id).single()) as any

      if (!adminUser || (adminUser as any)?.role !== 'super_admin') {
        router.push('/admin-login')
        return
      }

      setAdmin(adminUser)
    } catch (_error) {
      router.push('/admin-login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin-login')
  }

  if (loading || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">{isArabic ? 'جارٍ التحقق من الصلاحية...' : 'Verifying access...'}</div>
      </div>
    )
  }

  return (
    <AdminLangCtx.Provider value={isArabic}>
      <div
        className="flex h-screen bg-gray-100"
        dir={isArabic ? 'rtl' : 'ltr'}
        style={isArabic ? { fontFamily: "'Tajawal', sans-serif" } : {}}
      >
        {/* Sidebar */}
        <div className={`w-64 bg-gray-900 p-6 text-white ${isArabic ? 'text-right' : 'text-left'}`}>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{isArabic ? 'لوحة التحكم' : 'Admin Panel'}</h1>
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
              aria-label="Toggle language"
            >
              {isArabic ? 'EN' : 'AR'}
            </button>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'overview', label: isArabic ? 'نظرة عامة' : 'Dashboard Overview', icon: '📊' },
              { id: 'users', label: isArabic ? 'جميع المستخدمين' : 'All Users', icon: '👥' },
              { id: 'payments', label: isArabic ? 'المدفوعات' : 'Payments', icon: '💳' },
              { id: 'bank-transfers', label: isArabic ? 'التحويلات البنكية' : 'Bank Transfers', icon: '🏦' },
              { id: 'contact-messages', label: isArabic ? 'رسائل التواصل' : 'Contact Messages', icon: '💬' },
              { id: 'plans', label: isArabic ? 'إدارة الخطط' : 'Plans Management', icon: '📋' },
              { id: 'settings', label: isArabic ? 'الإعدادات' : 'Settings', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full rounded-lg px-4 py-2 transition ${isArabic ? 'text-right' : 'text-left'} ${
                  activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className={`mt-12 w-full rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 ${isArabic ? 'text-right' : 'text-left'}`}
          >
            🚪 {isArabic ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {activeTab === 'overview' && (isArabic ? 'نظرة عامة' : 'Dashboard Overview')}
                {activeTab === 'users' && (isArabic ? 'جميع المستخدمين' : 'All Users')}
                {activeTab === 'payments' && (isArabic ? 'إدارة المدفوعات' : 'Payment Management')}
                {activeTab === 'bank-transfers' && (isArabic ? 'اعتماد التحويلات' : 'Bank Transfer Approvals')}
                {activeTab === 'contact-messages' && (isArabic ? 'رسائل التواصل' : 'Contact Messages')}
                {activeTab === 'plans' && (isArabic ? 'إدارة الخطط' : 'Plans Management')}
                {activeTab === 'settings' && (isArabic ? 'الإعدادات' : 'Settings')}
              </h2>
            </div>

            {activeTab === 'overview' && <DashboardOverview />}
            {activeTab === 'users' && <UsersManagement />}
            {activeTab === 'payments' && <PaymentsManagement />}
            {activeTab === 'bank-transfers' && <BankTransfersManagement />}
            {activeTab === 'contact-messages' && <ContactMessagesPanel />}
            {activeTab === 'plans' && <PlansManagement />}
            {activeTab === 'settings' && <SettingsPanel />}
          </div>
        </div>
      </div>
    </AdminLangCtx.Provider>
  )
}

// Dashboard Overview Component
function DashboardOverview() {
  const isArabic = useContext(AdminLangCtx)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setError('')

      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) {
        throw new Error('Admin not authenticated')
      }

      const response = await fetch('/api/admin/dashboard/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: authData.user.id }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch dashboard stats')
      }

      setStats(payload.stats || null)
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error)
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">{isArabic ? 'إجمالي المستخدمين' : 'Total Users'}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalUsers}</p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">{isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
        <p className="mt-2 text-3xl font-bold text-green-600">${stats?.totalRevenue}</p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">{isArabic ? 'الاشتراكات النشطة' : 'Active Subscriptions'}</p>
        <p className="mt-2 text-3xl font-bold text-blue-600">{stats?.activeSubscriptions}</p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">{isArabic ? 'إجمالي الفعاليات' : 'Total Events'}</p>
        <p className="mt-2 text-3xl font-bold text-purple-600">{stats?.totalEvents}</p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">{isArabic ? 'بانتظار الاعتماد' : 'Pending Approvals'}</p>
        <p className="mt-2 text-3xl font-bold text-yellow-600">{stats?.pendingApprovals}</p>
      </div>
    </div>
  )
}

// Users Management Component
function UsersManagement() {
  const isArabic = useContext(AdminLangCtx)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [upgradeModal, setUpgradeModal] = useState<{ shown: boolean; userId: string | null }>({
    shown: false,
    userId: null,
  })
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [upgrading, setUpgrading] = useState(false)
  const [admin, setAdmin] = useState<any>(null)

  useEffect(() => {
    fetchAdmin()
    fetchUsers()
    fetchPlans()
    // Refresh users every 30 seconds to catch new registrations
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAdmin = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', authData.user.id).single()
        setAdmin(data)
      }
    } catch (error) {
      console.error('Failed to fetch admin:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      setPlans(data || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      if (!refreshing) setLoading(true)

      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/admin/users/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: authData.user.id }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch users')
      }

      setUsers(payload.users || [])
      if (payload.synced > 0) {
        console.log(`✅ Synced ${payload.synced} missing user profiles`)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      alert('Failed to load users. Please try refreshing.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
  }

  const handleUpgradeClick = (userId: string) => {
    setUpgradeModal({ shown: true, userId })
    setSelectedPlan('basic')
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      isArabic
        ? `هل أنت متأكد أنك تريد حذف المستخدم ${userEmail}؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to delete user ${userEmail}? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) throw new Error('Not authenticated')

      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: authData.user.id, userId }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to delete user')

      await fetchUsers()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!upgradeModal.userId || !selectedPlan || !admin) {
      alert('Please select a plan')
      return
    }

    setUpgrading(true)
    try {
      const response = await fetch('/api/admin/upgrade-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          userId: upgradeModal.userId,
          planType: selectedPlan,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade user')
      }

      alert(`✅ User upgraded to ${selectedPlan} plan successfully!`)
      setUpgradeModal({ shown: false, userId: null })
      setSelectedPlan('')
      await fetchUsers()
    } catch (error) {
      console.error('Upgrade error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upgrade user')
    } finally {
      setUpgrading(false)
    }
  }

  if (loading && users.length === 0) return <div>Loading users...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {isArabic ? 'إجمالي المستخدمين:' : 'Total Users:'} {users.length}
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? (isArabic ? 'جارٍ التحديث...' : 'Refreshing...') : `🔄 ${isArabic ? 'تحديث' : 'Refresh'}`}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {isArabic ? 'الاسم الكامل' : 'Full Name'}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">{isArabic ? 'الدور' : 'Role'}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {isArabic ? 'الحالة' : 'Status'}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">{isArabic ? 'الخطة' : 'Plan'}</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {isArabic ? 'تاريخ الانضمام' : 'Joined'}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {isArabic ? 'إجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.full_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">{user.role || 'user'}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      user.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.subscription_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.plan_type || 'free'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpgradeClick(user.id)}
                      className="font-medium text-blue-600 hover:text-blue-900"
                    >
                      {isArabic ? 'ترقية' : 'Upgrade'}
                    </button>
                    {user.role !== 'super_admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="font-medium text-red-600 hover:text-red-900"
                      >
                        {isArabic ? 'حذف' : 'Delete'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upgrade Modal */}
      {upgradeModal.shown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              {isArabic ? 'اختر الخطة للترقية' : 'Select Plan to Upgrade'}
            </h3>

            <div className="mb-6 space-y-3">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex cursor-pointer items-center rounded-lg border p-3 hover:bg-blue-50"
                  style={{ borderColor: selectedPlan === plan.name.toLowerCase() ? '#3b82f6' : '#e5e7eb' }}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.name.toLowerCase()}
                    checked={selectedPlan === plan.name.toLowerCase()}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-600">${plan.price_monthly}/month</p>
                  </div>
                </label>
              ))}
              {/* Free option */}
              <label
                className="flex cursor-pointer items-center rounded-lg border p-3 hover:bg-blue-50"
                style={{ borderColor: selectedPlan === 'free' ? '#3b82f6' : '#e5e7eb' }}
              >
                <input
                  type="radio"
                  name="plan"
                  value="free"
                  checked={selectedPlan === 'free'}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">{isArabic ? 'مجاني' : 'Free'}</p>
                  <p className="text-sm text-gray-600">{isArabic ? 'بدون تكلفة' : 'No cost'}</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setUpgradeModal({ shown: false, userId: null })
                  setSelectedPlan('')
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmUpgrade}
                disabled={upgrading || !selectedPlan}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {upgrading ? (isArabic ? 'جارٍ الترقية...' : 'Upgrading...') : isArabic ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Payments Management Component
function PaymentsManagement() {
  const isArabic = useContext(AdminLangCtx)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
    const interval = setInterval(fetchPayments, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/payments/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: authData.user.id }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payments')
      }

      setPayments(result.payments || [])
      setError(null)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to fetch payments:', error)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return <div className="text-gray-600">{isArabic ? 'جارٍ تحميل المدفوعات...' : 'Loading payments...'}</div>

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="font-semibold text-red-800">{isArabic ? 'خطأ في تحميل المدفوعات' : 'Error loading payments'}</p>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <p className="mt-2 text-xs text-red-600">
          {isArabic
            ? 'تحقق من وحدة التحكم في المتصفح (F12) لمزيد من التفاصيل'
            : 'Check browser console (F12) for more details'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {payments.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow">
          <p className="text-lg">{isArabic ? 'لا توجد مدفوعات' : 'No payments found'}</p>
          <p className="mt-2 text-sm">
            {isArabic
              ? 'ستظهر المدفوعات هنا بمجرد إتمام المستخدمين للشراء'
              : 'Payments will appear here once users make purchases'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  {isArabic ? 'الاسم الكامل' : 'Full Name'}
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">{isArabic ? 'الخطة' : 'Plan'}</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">{isArabic ? 'المبلغ' : 'Amount'}</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">{isArabic ? 'الطريقة' : 'Method'}</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">{isArabic ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">{isArabic ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment: any) => {
                const user = payment.users?.[0] || payment.users
                const plan = payment.subscription_plans

                return (
                  <tr key={payment.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{user?.email || (isArabic ? 'غير متوفر' : 'N/A')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user?.full_name || (isArabic ? 'غير معروف' : 'Unknown')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{plan?.name || (isArabic ? 'غير متوفر' : 'N/A')}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">${parseFloat(payment.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          payment.payment_method === 'paypal'
                            ? 'font-medium text-blue-600'
                            : 'font-medium text-green-600'
                        }
                      >
                        {payment.payment_method === 'bank_transfer'
                          ? isArabic
                            ? 'تحويل بنكي'
                            : 'Bank Transfer'
                          : payment.payment_method === 'paypal'
                            ? 'PayPal'
                            : payment.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          payment.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status === 'paid'
                          ? isArabic
                            ? '✅ مدفوع'
                            : '✅ Paid'
                          : payment.status === 'pending'
                            ? isArabic
                              ? '⏳ قيد الانتظار'
                              : '⏳ Pending'
                            : isArabic
                              ? '❌ فشل'
                              : '❌ Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(payment.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Bank Transfers Management Component
function BankTransfersManagement() {
  const isArabic = useContext(AdminLangCtx)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchAdmin()
    fetchPendingTransfers()
    const interval = setInterval(fetchPendingTransfers, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAdmin = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user?.id) {
        const { data } = await supabase.from('users').select('*').eq('id', authData.user.id).single()
        setAdmin(data)
      }
    } catch (error) {
      console.error('Failed to fetch admin:', error)
    }
  }

  const fetchPendingTransfers = async () => {
    try {
      setLoading(true)
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/bank-transfers/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: authData.user.id }),
      })

      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Failed to fetch transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (paymentId: string) => {
    if (!admin) return

    setProcessing(paymentId)
    try {
      const response = await fetch('/api/admin/bank-transfers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          paymentId,
          action: 'approve',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      alert('✅ ' + data.message)
      await fetchPendingTransfers()
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to approve'))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (paymentId: string) => {
    if (!admin) return

    setProcessing(paymentId)
    try {
      const response = await fetch('/api/admin/bank-transfers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          paymentId,
          action: 'reject',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      alert('✅ ' + data.message)
      await fetchPendingTransfers()
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to reject'))
    } finally {
      setProcessing(null)
    }
  }

  const handleViewProof = (payment: any) => {
    setSelectedPayment(payment)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="text-gray-600">
        {isArabic ? 'جارٍ تحميل التحويلات المعلقة...' : 'Loading pending transfers...'}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="py-8 text-center text-gray-600">
        {isArabic ? 'لا توجد تحويلات بنكية معلقة' : 'No pending bank transfer payments'}
      </div>
    )
  }

  return (
    <>
      {/* Table Layout */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                {isArabic ? 'الاسم الكامل' : 'Full Name'}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                {isArabic ? 'المبلغ' : 'Amount'}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{isArabic ? 'الخطة' : 'Plan'}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                {isArabic ? 'تاريخ الإرسال' : 'Submitted'}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                {isArabic ? 'إجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment: any) => {
              const user = payment.users?.[0] || payment.users
              const plan = payment.subscription_plans

              return (
                <tr key={payment.id} className="border-b transition hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{user?.email}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {user?.full_name || (isArabic ? 'غير معروف' : 'Unknown')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    ${parseFloat(payment.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {plan?.name || (isArabic ? 'غير معروف' : 'Unknown')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.created_at)}</td>
                  <td className="flex space-x-2 px-6 py-4 text-sm">
                    <button
                      onClick={() => handleViewProof(payment)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      👁️ {isArabic ? 'عرض' : 'View'}
                    </button>
                    <button
                      onClick={() => handleApprove(payment.id)}
                      disabled={processing === payment.id}
                      className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing === payment.id ? '...' : isArabic ? '✅ اعتماد' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(payment.id)}
                      disabled={processing === payment.id}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing === payment.id ? '...' : isArabic ? '❌ رفض' : '❌ Reject'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for Viewing Payment Proof */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b bg-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isArabic ? 'مراجعة إثبات الدفع' : 'Payment Proof Review'}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedPayment.users?.[0]?.full_name || selectedPayment.users?.full_name} -{' '}
                  {selectedPayment.users?.[0]?.email || selectedPayment.users?.email}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-2xl text-gray-600 hover:text-gray-900">
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-6">
              {/* Payment Details Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-600">{isArabic ? 'المبلغ' : 'Amount'}</p>
                  <p className="text-2xl font-bold text-green-600">${parseFloat(selectedPayment.amount).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-600">{isArabic ? 'الخطة' : 'Plan'}</p>
                  <p className="text-lg font-bold text-blue-600">{selectedPayment.subscription_plans?.name}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-600">
                    {isArabic ? 'تاريخ الإرسال' : 'Date Submitted'}
                  </p>
                  <p className="text-sm text-gray-900">{formatDate(selectedPayment.created_at)}</p>
                </div>
              </div>

              {/* Payment Proof Image */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">
                  {isArabic ? 'صورة إثبات الدفع' : 'Payment Proof Screenshot'}
                </h4>
                <div className="overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-100">
                  {selectedPayment.receipt_url ? (
                    <img src={selectedPayment.receipt_url} alt="Payment Proof" className="h-auto w-full" />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center text-gray-400">
                      {isArabic ? 'لم يتم رفع صورة' : 'No image uploaded'}
                    </div>
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 font-semibold text-gray-900">{isArabic ? 'تفاصيل العميل' : 'Customer Details'}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-600">
                      {isArabic ? 'الاسم الكامل' : 'Full Name'}
                    </p>
                    <p className="text-gray-900">
                      {selectedPayment.users?.[0]?.full_name || selectedPayment.users?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-600">
                      {isArabic ? 'البريد الإلكتروني' : 'Email'}
                    </p>
                    <p className="text-gray-900">{selectedPayment.users?.[0]?.email || selectedPayment.users?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-600">{isArabic ? 'الهاتف' : 'Phone'}</p>
                    <p className="text-gray-900">
                      {selectedPayment.users?.[0]?.phone ||
                        selectedPayment.users?.phone ||
                        (isArabic ? 'لا يوجد رقم' : 'No phone')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-600">
                      {isArabic ? 'الخطة الحالية' : 'Current Plan'}
                    </p>
                    <p className="text-gray-900">
                      {selectedPayment.users?.[0]?.plan_type || selectedPayment.users?.plan_type}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="sticky bottom-0 flex gap-3 border-t bg-gray-100 px-6 py-4">
              <button
                onClick={() => {
                  handleApprove(selectedPayment.id)
                  setShowModal(false)
                }}
                disabled={processing === selectedPayment.id}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {processing === selectedPayment.id
                  ? isArabic
                    ? '⏳ جارٍ المعالجة...'
                    : '⏳ Processing...'
                  : isArabic
                    ? '✅ اعتماد وترقية'
                    : '✅ Approve & Upgrade'}
              </button>
              <button
                onClick={() => {
                  handleReject(selectedPayment.id)
                  setShowModal(false)
                }}
                disabled={processing === selectedPayment.id}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {processing === selectedPayment.id
                  ? isArabic
                    ? '⏳ جارٍ المعالجة...'
                    : '⏳ Processing...'
                  : isArabic
                    ? '❌ رفض'
                    : '❌ Reject'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-gray-500 px-4 py-2 text-white transition hover:bg-gray-600"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Contact Messages Component
function ContactMessagesPanel() {
  const isArabic = useContext(AdminLangCtx)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const admin = await getCurrentUser()
      const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
      setMessages(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>{isArabic ? 'جارٍ تحميل الرسائل...' : 'Loading messages...'}</div>

  return (
    <div className="space-y-4">
      {messages.map((msg: any) => (
        <div key={msg.id} className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{msg.name}</p>
              <p className="text-sm text-gray-600">{msg.email}</p>
              <p className="mt-2 text-gray-700">{msg.message}</p>
              <p className="mt-2 text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                msg.status === 'read' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {msg.status === 'read' ? (isArabic ? 'مقروء' : 'read') : isArabic ? 'غير مقروء' : 'unread'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Plans Management Component
function PlansManagement() {
  const isArabic = useContext(AdminLangCtx)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    price_paypal: '',
    event_limit: '',
    is_active: true,
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const { data } = await supabase.from('subscription_plans').select('*').order('display_order', { ascending: true })
      setPlans(data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (plan: any) => {
    setError('')
    setSuccess('')
    setEditingPlanId(plan.id)
    setForm({
      name: plan.name || '',
      description: plan.description || '',
      price_paypal: (plan.price_paypal ?? plan.price_monthly ?? '').toString(),
      event_limit: plan.event_limit === null || plan.event_limit === undefined ? '' : plan.event_limit.toString(),
      is_active: !!plan.is_active,
    })
  }

  const handleCancelEdit = () => {
    setEditingPlanId(null)
    setError('')
  }

  const handleSavePlan = async (planId: string) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!form.name.trim()) {
        throw new Error('Plan name is required')
      }

      const priceValue = Number(form.price_paypal)
      if (Number.isNaN(priceValue) || priceValue < 0) {
        throw new Error('Price must be a valid number')
      }

      const eventLimitValue = form.event_limit.trim() === '' ? null : Number(form.event_limit)
      if (eventLimitValue !== null && (Number.isNaN(eventLimitValue) || eventLimitValue < 1)) {
        throw new Error('Event limit must be empty or greater than 0')
      }

      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user?.id) {
        throw new Error('Admin session expired. Please login again.')
      }

      const response = await fetch('/api/admin/plans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: authData.user.id,
          planId,
          updates: {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price: priceValue,
            event_limit: eventLimitValue,
            is_active: form.is_active,
          },
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update plan')
      }

      setPlans((prev) => prev.map((plan) => (plan.id === planId ? payload.plan : plan)))
      setEditingPlanId(null)
      setSuccess('Plan updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to update plan')
    } finally {
      setSaving(false)
    }
  }

  const getLocalizedPlanName = (plan: any) => {
    if (!isArabic) return plan.name

    const name = String(plan.name || '')
      .trim()
      .toLowerCase()
    const planNameMap: Record<string, string> = {
      basic: 'الأساسية',
      pro: 'الاحترافية',
      enterprise: 'المؤسسية',
    }

    return planNameMap[name] || plan.name
  }

  const getLocalizedPlanDescription = (plan: any) => {
    if (!isArabic) return plan.description

    const name = String(plan.name || '')
      .trim()
      .toLowerCase()
    const descriptionMap: Record<string, string> = {
      basic: 'مثالية للبدء',
      pro: 'للشركات في مرحلة النمو',
      enterprise: 'كامل المزايا مع دعم متقدم',
    }

    return descriptionMap[name] || plan.description
  }

  if (loading) return <div>{isArabic ? 'جارٍ تحميل الخطط...' : 'Loading plans...'}</div>

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-100 p-3 text-sm text-green-700">{success}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan: any) => (
          <div key={plan.id} className="rounded-lg bg-white p-6 shadow">
            {editingPlanId === plan.id ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {isArabic ? 'اسم الخطة' : 'Plan Name'}
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {isArabic ? 'السعر (دولار / شهر)' : 'Price (USD / month)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_paypal}
                    onChange={(e) => setForm((prev) => ({ ...prev, price_paypal: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {isArabic ? 'حد الفعاليات (فارغ = غير محدود)' : 'Event Limit (empty = unlimited)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.event_limit}
                    onChange={(e) => setForm((prev) => ({ ...prev, event_limit: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder={isArabic ? 'غير محدود' : 'Unlimited'}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {isArabic ? 'الوصف' : 'Description'}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  {isArabic ? 'خطة نشطة' : 'Active Plan'}
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSavePlan(plan.id)}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (isArabic ? 'جارٍ الحفظ...' : 'Saving...') : isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-300 disabled:opacity-50"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900">{getLocalizedPlanName(plan)}</h3>
                <p className="mt-2 text-2xl font-bold text-blue-600">
                  ${plan.price_paypal ?? plan.price_monthly ?? 0}
                  {isArabic ? '/شهريا' : '/mo'}
                </p>
                <p className="mt-4 text-sm text-gray-600">{getLocalizedPlanDescription(plan)}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-700">
                    {isArabic ? 'الفعاليات:' : 'Events:'}{' '}
                    {plan.event_limit === null || plan.event_limit === undefined
                      ? isArabic
                        ? 'غير محدود'
                        : 'Unlimited'
                      : plan.event_limit}
                  </p>
                  <p className="text-sm text-gray-700">
                    {isArabic ? 'الحالة:' : 'Status:'}{' '}
                    {plan.is_active ? (isArabic ? 'نشطة' : 'Active') : isArabic ? 'غير نشطة' : 'Inactive'}
                  </p>
                </div>
                <button
                  onClick={() => handleStartEdit(plan)}
                  className="mt-4 w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-300"
                >
                  {isArabic ? 'تعديل الخطة' : 'Edit Plan'}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Settings Component
function SettingsPanel() {
  const isArabic = useContext(AdminLangCtx)
  return (
    <div className="max-w-2xl rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-xl font-bold text-gray-900">{isArabic ? 'إعدادات الإدارة' : 'Admin Settings'}</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {isArabic ? 'معلومات الحساب البنكي' : 'Bank Account Information'}
          </label>
          <p className="text-sm text-gray-600">
            {isArabic ? 'إدارة تفاصيل التحويل البنكي في قاعدة البيانات' : 'Manage bank transfer details in database'}
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {isArabic ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
          </label>
          <input type="checkbox" defaultChecked className="rounded" />{' '}
          {isArabic ? 'تفعيل تنبيهات البريد للاعتمادات المعلقة' : 'Enable email alerts for pending approvals'}
        </div>
        <button className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
          {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

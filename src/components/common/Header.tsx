'use client'

import LocaleSwitch from '@/components/common/LocaleSwitch'
import Icon from '@/components/ui/AppIcon'
import AppImage from '@/components/ui/AppImage'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface HeaderProps {
  className?: string
}

const Header = ({ className = '' }: HeaderProps) => {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const pathname = usePathname()
  const router = useRouter()
  const [isEventSelectorOpen, setIsEventSelectorOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(isArabic ? 'حفل زفاف - سارة وأحمد' : 'Wedding - Sarah & Ahmed')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const navigationTabs = [
    {
      label: 'Events',
      labelAr: 'الفعاليات',
      path: '/event-management-dashboard',
      icon: 'CalendarIcon',
      tooltip: isArabic ? 'إدارة فعالياتك والقوالب الخاصة بك' : 'Manage your events and templates',
    },
    {
      label: 'Guests',
      labelAr: 'الضيوف',
      path: '/guest-list-management',
      icon: 'UsersIcon',
      tooltip: isArabic ? 'إدارة قوائم الضيوف والتواصل' : 'Manage guest lists and communications',
    },
    {
      label: 'Check-in',
      labelAr: 'تسجيل الحضور',
      path: '/qr-check-in-system',
      icon: 'QrCodeIcon',
      tooltip: isArabic ? 'متابعة الحضور بشكل فوري' : 'Real-time attendance tracking',
    },
  ]

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        const { data: userProfile } = (await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()) as any
        setUser({ ...currentUser, profile: userProfile })
      }
    } catch (error) {
      console.warn('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}/auth/login`)
  }

  const getUserInitials = () => {
    const displayName = user?.profile?.full_name?.trim() || user?.email?.trim() || 'User'
    const parts = displayName.split(/\s+/).filter(Boolean)

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }

    return parts
      .slice(0, 2)
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
  }

  const events = [
    {
      id: 1,
      name: isArabic ? 'حفل زفاف - سارة وأحمد' : 'Wedding - Sarah & Ahmed',
      date: '2026-03-15',
      status: 'active',
    },
    {
      id: 2,
      name: isArabic ? 'الحفل المؤسسي 2026' : 'Corporate Gala 2026',
      date: '2026-04-20',
      status: 'planning',
    },
    {
      id: 3,
      name: isArabic ? 'عيد ميلاد - محمد' : 'Birthday - Mohammed',
      date: '2026-05-10',
      status: 'planning',
    },
  ]

  const getEventStatusLabel = (status: string) => {
    if (!isArabic) return status

    const statusMap: Record<string, string> = {
      active: 'نشط',
      planning: 'قيد التخطيط',
      completed: 'مكتمل',
    }

    return statusMap[status] || status
  }

  useEffect(() => {
    setSelectedEvent(isArabic ? 'حفل زفاف - سارة وأحمد' : 'Wedding - Sarah & Ahmed')
  }, [isArabic])

  const handleEventSelect = (eventName: string) => {
    setSelectedEvent(eventName)
    setIsEventSelectorOpen(false)
  }

  const localizedPath = (path: string) => `/${locale}${path}`

  return (
    <header className={`fixed left-0 right-0 top-0 z-100 bg-card shadow-warm-md ${className}`}>
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:h-20 md:px-8">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          <Link
            href={localizedPath('/event-management-dashboard')}
            className="transition-smooth flex items-center gap-2 hover:opacity-80 md:gap-3"
          >
            <AppImage
              src="/logo.png"
              alt="Marasim logo"
              width={40}
              height={40}
              className="h-8 w-8 rounded-md md:h-10 md:w-10"
            />
            <span className="hidden font-heading text-lg font-semibold text-primary sm:inline md:text-xl">Marasim</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsEventSelectorOpen(!isEventSelectorOpen)}
              className="transition-smooth hover:bg-muted/80 flex items-center gap-1 rounded-md bg-muted px-2 py-2 focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2 sm:gap-2 sm:px-3 md:px-4"
              aria-label={isArabic ? 'اختر الفعالية' : 'Select event'}
              aria-expanded={isEventSelectorOpen}
            >
              <Icon name="CalendarIcon" size={18} className="text-primary sm:h-5 sm:w-5" />
              <span className="hidden max-w-[100px] truncate text-xs font-medium text-text-primary sm:inline sm:max-w-[150px] sm:text-sm md:max-w-[200px]">
                {selectedEvent}
              </span>
              <Icon
                name="ChevronDownIcon"
                size={14}
                className={`transition-smooth text-text-secondary sm:h-4 sm:w-4 ${isEventSelectorOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isEventSelectorOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setIsEventSelectorOpen(false)} aria-hidden="true" />
                <div className="absolute left-0 top-full z-200 mt-2 w-72 animate-slide-in overflow-hidden rounded-md bg-popover shadow-warm-lg sm:w-80">
                  <div className="p-2">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventSelect(event.name)}
                        className={`transition-smooth flex w-full items-center justify-between rounded-md px-3 py-2 hover:bg-muted sm:px-4 sm:py-3 ${
                          selectedEvent === event.name ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-medium text-text-primary sm:text-sm">{event.name}</span>
                          <span className="text-xs text-text-secondary">{event.date}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            event.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {getEventStatusLabel(event.status)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border p-2">
                    <Link
                      href={localizedPath('/event-management-dashboard')}
                      className="transition-smooth flex items-center gap-2 rounded-md px-3 py-2 text-xs text-primary hover:bg-muted sm:px-4 sm:text-sm"
                      onClick={() => setIsEventSelectorOpen(false)}
                    >
                      <Icon name="PlusIcon" size={16} />
                      <span>{isArabic ? 'إنشاء فعالية جديدة' : 'Create New Event'}</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {navigationTabs.map((tab) => {
            const href = localizedPath(tab.path)
            const isActive = pathname === href
            return (
              <Link
                key={tab.path}
                href={href}
                className={`transition-smooth flex items-center gap-1 rounded-md px-2 py-2 hover:bg-muted sm:gap-2 sm:px-4 md:px-6 md:py-3 ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-text-primary'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={tab.tooltip}
              >
                <Icon name={tab.icon as any} size={18} className="sm:h-5 sm:w-5" />
                <span className="hidden text-sm font-medium md:inline">{isArabic ? tab.labelAr : tab.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Profile Dropdown */}
        {!loading && user && (
          <div className="relative flex items-center gap-2 sm:gap-3">
            <LocaleSwitch />
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="transition-smooth flex items-center gap-2 rounded-md px-1 py-2 hover:bg-muted focus:outline-none sm:gap-3 sm:px-2 md:px-3"
              aria-label={isArabic ? 'قائمة ملف المستخدم' : 'User profile menu'}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:h-9 sm:w-9 sm:text-sm md:h-10 md:w-10">
                {getUserInitials()}
              </div>
            </button>

            {isProfileMenuOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setIsProfileMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full z-200 mt-2 w-56 overflow-hidden rounded-md bg-popover shadow-warm-lg sm:w-64">
                  <div className="border-b border-border p-3 sm:p-4">
                    <p className="text-xs font-semibold text-text-primary sm:text-sm">
                      {user?.profile?.full_name || (isArabic ? 'المستخدم' : 'User')}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{user?.email}</p>
                    {user?.profile && (
                      <>
                        <p className="mt-2 text-xs text-text-secondary">
                          {isArabic ? 'الخطة:' : 'Plan:'}{' '}
                          <span className="font-medium capitalize">
                            {user.profile.plan_type || (isArabic ? 'مجانية' : 'Free')}
                          </span>
                        </p>
                        <p className="text-xs text-text-secondary">
                          {isArabic ? 'الحالة:' : 'Status:'}{' '}
                          <span className="font-medium capitalize">{user.profile.subscription_status}</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div className="p-2">
                    <Link
                      href={localizedPath('/event-management-dashboard')}
                      className="transition-smooth flex items-center gap-3 rounded-md px-3 py-2 text-xs text-text-primary hover:bg-muted sm:px-4 sm:text-sm"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Icon name="SettingsIcon" size={16} />
                      <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsProfileMenuOpen(false)
                      }}
                      className="transition-smooth flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-red-600 hover:bg-red-50 sm:px-4 sm:text-sm"
                    >
                      <Icon name="LogOutIcon" size={16} />
                      <span>{isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

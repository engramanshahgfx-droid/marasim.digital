'use client'

import { getCurrentUser } from '@/lib/auth'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

interface UserAuthGuardProps {
  children: ReactNode
}

export default function UserAuthGuard({ children }: UserAuthGuardProps) {
  const locale = useLocale()
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true

    const verifyUser = async () => {
      try {
        const user = await getCurrentUser()

        if (!user) {
          router.replace(`/${locale}/auth/login`)
          return
        }

        if (isMounted) {
          setIsAllowed(true)
        }
      } catch {
        router.replace(`/${locale}/auth/login`)
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    verifyUser()

    return () => {
      isMounted = false
    }
  }, [locale, router])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAllowed) {
    return null
  }

  return <>{children}</>
}

import Header from '@/components/common/Header'
import QuickActionToolbar from '@/components/common/QuickActionToolbar'
import StatusIndicatorBar from '@/components/common/StatusIndicatorBar'
import UserAuthGuard from '@/components/UserAuthGuard'
import type { Metadata } from 'next'
import QRCheckInInteractive from './components/QRCheckInInteractive'

export const metadata: Metadata = {
  title: 'QR Check-in System - Marasim',
  description:
    'Real-time attendance tracking through secure QR code scanning with duplicate prevention and instant status updates for event management.',
}

export default function QRCheckInSystemPage() {
  return (
    <UserAuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <StatusIndicatorBar className="mt-20" />

        <main className="px-8 pb-12 pt-6">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">QR Check-in System</h1>
                <p className="text-text-secondary">
                  Real-time attendance tracking with secure QR code scanning and manual check-in options
                </p>
              </div>
              <QuickActionToolbar />
            </div>

            <QRCheckInInteractive />
          </div>
        </main>
      </div>
    </UserAuthGuard>
  )
}

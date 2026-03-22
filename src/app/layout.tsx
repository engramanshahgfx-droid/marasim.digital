import type { Metadata, Viewport } from 'next'
import React from 'react'
import '../styles/index.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Marasim',
  description: 'Manage events and send invitations with ease',
  metadataBase: new URL('https://marasim.digital/'),
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: [{ url: '/logo.png', type: 'image/png' }],
    apple: [{ url: '/logo.png', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}

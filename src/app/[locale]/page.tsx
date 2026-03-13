'use client'

import { getCurrentUser } from '@/lib/auth'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const features = [
  {
    icon: '📩',
    title: 'Digital Invitations',
    description: 'Create beautiful digital invitations and send them via WhatsApp instantly.',
  },
  {
    icon: '📋',
    title: 'Guest Management',
    description: 'Upload guest lists, track RSVPs, and manage responses in real-time.',
  },
  {
    icon: '📱',
    title: 'QR Check-in',
    description: 'Generate unique QR codes for each guest and track attendance live.',
  },
  {
    icon: '📊',
    title: 'Analytics & Reports',
    description: 'Get detailed reports on invitations sent, RSVPs, and attendance rates.',
  },
  {
    icon: '🌐',
    title: 'Bilingual Support',
    description: 'Full Arabic and English support for invitations and dashboard.',
  },
  {
    icon: '🔒',
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with Supabase and Stripe payment processing.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Create Your Event',
    description: 'Set up your event details — name, date, venue, and invitation template.',
  },
  {
    number: '2',
    title: 'Add Your Guests',
    description: 'Upload your guest list via CSV/Excel or add them manually.',
  },
  {
    number: '3',
    title: 'Send & Track',
    description: 'Send WhatsApp invitations and track RSVPs and attendance in real-time.',
  },
]

const plans = [
  {
    name: 'Basic',
    price: '$29.99',
    period: '/month',
    color: 'bg-green-500',
    features: ['1 Event', '200 Guests', '1,000 WhatsApp Messages', 'QR Codes', 'Basic Reports'],
  },
  {
    name: 'Pro',
    price: '$99.99',
    period: '/month',
    color: 'bg-blue-600',
    popular: true,
    features: ['5 Events', '1,000 Guests', '5,000 WhatsApp Messages', 'Advanced Reports', 'Excel Export'],
  },
  {
    name: 'Enterprise',
    price: '$299.99',
    period: '/month',
    color: 'bg-purple-600',
    features: ['Unlimited Events', 'Unlimited Guests', 'Unlimited Messages', 'Priority Support', 'Custom Branding'],
  },
]

export default function HomePage() {
  const locale = useLocale()
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
                <img src="/logo.png" alt="Marasim Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-bold text-gray-900">Marasim</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
                How it Works
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/auth/login`}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Create Invitation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            ✨ Start Free — No Credit Card Required
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
            Create Digital Invitations <span className="text-blue-600">Easily</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
            Manage events, send WhatsApp invitations, track RSVPs, and handle QR check-ins — all from one powerful
            platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/auth/register`}
              className="w-full rounded-lg bg-blue-600 px-8 py-3.5 text-center font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
            >
              Create Invitation →
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-lg border border-gray-300 px-8 py-3.5 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              See How it Works
            </a>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-16">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-2xl">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-400">Marasim.app/dashboard</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">248</div>
                    <div className="text-sm text-gray-500">Guests Invited</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">186</div>
                    <div className="text-sm text-gray-500">Confirmed</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">142</div>
                    <div className="text-sm text-gray-500">Checked In</div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex h-32 items-end justify-around gap-2">
                    {[40, 65, 85, 70, 90, 75, 95].map((h, i) => (
                      <div key={i} className="w-full rounded-t-md bg-blue-500" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-400">Weekly Invitation Activity</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-lg text-gray-600">Get started in 3 simple steps</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="text-lg text-gray-600">Powerful tools to manage your events from start to finish</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Start free, upgrade when you&apos;re ready</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`overflow-hidden rounded-xl border-2 bg-white ${
                  plan.popular ? 'relative border-blue-600 shadow-xl' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-600 py-1.5 text-center text-xs font-bold text-white">MOST POPULAR</div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="ml-1 text-gray-500">{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/${locale}/auth/register`}
                    className={`mt-6 block rounded-lg py-2.5 text-center font-medium transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Ready to Simplify Your Event Management?</h2>
          <p className="mb-8 text-lg text-gray-600">
            Join thousands of event organizers who use Marasim to create stunning digital invitations.
          </p>
          <Link
            href={`/${locale}/auth/register`}
            className="inline-block rounded-lg bg-blue-600 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Create Your Invitation →
          </Link>
          <p className="mt-4 text-sm text-gray-500">No credit card required · Free plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-12  sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden">
              <img src="/logo.png" alt="Marasim Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold text-white">Marasim</span>
          </div>

          <p className="text-sm">© {new Date().getFullYear()} Marasim. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

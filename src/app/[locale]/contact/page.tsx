'use client'

import { useLocale } from 'next-intl'
import { useState } from 'react'

export default function ContactPage() {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const content = {
    title: isArabic ? 'تواصل معنا' : 'Get in Touch',
    subtitle: isArabic ? 'هل لديك أسئلة؟ يسعدنا التواصل معك.' : 'Have questions? We would love to hear from you.',
    success: isArabic
      ? 'شكرًا لرسالتك! سنعود إليك قريبًا.'
      : 'Thank you for your message! We will get back to you soon.',
    name: isArabic ? 'الاسم' : 'Name',
    email: isArabic ? 'البريد الإلكتروني' : 'Email',
    message: isArabic ? 'الرسالة' : 'Message',
    sending: isArabic ? 'جارٍ الإرسال...' : 'Sending...',
    send: isArabic ? 'إرسال الرسالة' : 'Send Message',
    phone: isArabic ? 'الجوال' : 'Phone',
    hours: isArabic ? 'ساعات العمل' : 'Hours',
    hoursValue: isArabic ? 'الاثنين - الجمعة، 9 ص - 6 م' : 'Mon - Fri, 9 AM - 6 PM',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (response.ok) {
        setSuccess(true)
        setForm({ name: '', email: '', message: '' })
        setTimeout(() => setSuccess(false), 5000)
      }
    } catch (error) {
      console.error('Contact error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">{content.title}</h1>
          <p className="mt-4 text-lg text-gray-600">{content.subtitle}</p>
        </div>

        <div className="rounded-lg bg-white p-12 shadow-lg">
          {success && <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-700">{content.success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">{content.name}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{content.email}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{content.message}</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? content.sending : content.send}
            </button>
          </form>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { label: content.email, value: 'support@marasim.digital' },
            { label: content.phone, value: '+966 55 1981 751' },
            { label: content.hours, value: content.hoursValue },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

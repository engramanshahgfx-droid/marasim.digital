// Marketplace Error Handling Guide
// Location: MARKETPLACE_ERROR_HANDLING_GUIDE.md

# Marketplace Error Handling Guide

Complete guide for implementing consistent error handling across the event invitation management platform marketplace.

## Overview

This guide covers:
- Global error pages (already implemented)
- Marketplace-specific error pages
- Reusable error components
- API error standardization
- Error logging and monitoring
- User-friendly error messages

---

## 1. Global Error Pages (Already Implemented)

All global error pages support bilingual content (Arabic/English) and RTL layouts.

### Files
- `src/app/[locale]/error.tsx` - Catch-all error boundary
- `src/app/[locale]/not-found.tsx` - 404 for non-existent routes
- `src/app/[locale]/500.tsx` - Server errors (500)

### Features
✅ Full i18n support (Arabic/English)
✅ RTL/LTR layout support
✅ Locale-aware routing
✅ Helpful suggestions and recovery actions
✅ Error reference numbers (for tracking)
✅ Contact support links

**Example Usage**: These pages are automatically triggered by Next.js when errors occur globally.

---

## 2. Marketplace-Specific Error Pages

### Service Not Found
**File**: `src/app/[locale]/marketplace/[serviceId]/not-found.tsx`

Triggered when a service ID doesn't exist or is deleted.

**Features**:
- Service icon indicator
- Browse Services button
- Helpful tip for searching
- Bilingual support

**When Used**:
```typescript
// In src/app/[locale]/marketplace/[serviceId]/page.tsx
export default async function ServiceDetailPage({
  params: { locale, serviceId },
}: {
  params: { locale: string; serviceId: string }
}) {
  const service = await getService(serviceId)
  
  // Trigger not-found automatically
  if (!service) {
    notFound() // Uses not-found.tsx
  }

  return <ServiceDetail service={service} />
}
```

---

### Payment Error Page
**File**: `src/app/[locale]/payment-error/page.tsx`

Displayed when payment processing fails.

**Features**:
- Error code display
- Common reasons for failure
- Expandable error details
- My Bookings & Support buttons
- Bilingual support

**When Used**:
```typescript
// In booking form submission
async function handlePayment(bookingData: CreateBookingRequest) {
  try {
    const response = await fetch('/api/marketplace/bookings/create', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    })

    if (!response.ok) {
      // Redirect with error code
      redirect(`/${locale}/payment-error?code=${response.status}`)
    }

    return response.json()
  } catch (error) {
    redirect(`/${locale}/payment-error?code=NETWORK_ERROR`)
  }
}
```

---

## 3. Reusable Error Components

### ErrorBoundary Component
**File**: `src/components/error/ErrorBoundary.tsx`

React error boundary for catching unexpected errors in components.

**Props**:
```typescript
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}
```

**Basic Usage**:
```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ErrorFallback } from '@/components/error/ErrorFallback'

export default function ServicePage() {
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          title="Failed to load service"
          description="Please try reloading the page"
        />
      }
      onError={(error, info) => {
        console.error('Service page error:', error, info)
        // Send to error tracking service
      }}
    >
      <ServiceDetail />
    </ErrorBoundary>
  )
}
```

**Advanced Usage**:
```tsx
<ErrorBoundary
  fallback={
    <ErrorFallback
      error="Failed to fetch booking details"
      title="Booking Load Error"
      actionLabel="Back to Bookings"
      actionHref="/en/my-bookings"
      showContactSupport={true}
    />
  }
>
  <BookingDetails bookingId={bookingId} />
</ErrorBoundary>
```

---

### ErrorFallback Component
**File**: `src/components/error/ErrorFallback.tsx`

Customizable error display component (non-boundary).

**Props**:
```typescript
interface ErrorFallbackProps {
  error?: string              // Technical error message
  title?: string              // User-friendly title
  description?: string        // Helpful description
  showContactSupport?: boolean // Show support button
  actionLabel?: string        // Custom button label
  actionHref?: string         // Custom button href
}
```

**Usage Examples**:

**Example 1: Booking Form Validation Error**
```tsx
import { ErrorFallback } from '@/components/error/ErrorFallback'

export function BookingForm({ serviceId }: { serviceId: string }) {
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <ErrorFallback
        title="Booking Error"
        description="Please check your details and try again"
        error={error}
        actionLabel="Back to Service"
        actionHref={`/en/marketplace/${serviceId}`}
      />
    )
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

**Example 2: Service List Loading Error**
```tsx
export function ServiceGrid() {
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState([])

  useEffect(() => {
    fetchServices()
      .catch((err) => {
        setError(err.message)
      })
  }, [])

  if (error) {
    return (
      <ErrorFallback
        error={error}
        title="Failed to Load Services"
        description="There was a problem loading available services"
        showContactSupport={true}
      />
    )
  }

  return <div className="grid gap-4">{/* services */}</div>
}
```

---

## 4. API Error Standardization

### Standard Error Response Format

All marketplace APIs should return errors in this format:

```typescript
// src/types/api.ts
export interface ApiErrorResponse {
  success: false
  error: {
    code: string           // e.g., "SERVICE_NOT_FOUND"
    message: string        // User-friendly message
    details?: string       // Optional technical details
    reference?: string     // Error reference ID
    timestamp: number      // Error timestamp
  }
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  reference?: string      // Optional request reference
  timestamp: number
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
```

### Example API Endpoint with Error Handling

```typescript
// src/app/api/marketplace/services/[id]/route.ts
import { ApiResponse } from '@/types/api'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    // Validate request
    if (!params.id) {
      return Response.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_SERVICE_ID',
            message: 'Service ID is required',
            timestamp: Date.now(),
          },
        },
        { status: 400 }
      )
    }

    // Fetch service
    const service = await getService(params.id)

    if (!service) {
      return Response.json<ApiErrorResponse>(
        {
          success: false,
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: 'The requested service does not exist',
            reference: `SVC_${params.id}`,
            timestamp: Date.now(),
          },
        },
        { status: 404 }
      )
    }

    // Return success
    return Response.json<ApiSuccessResponse<typeof service>>(
      {
        success: true,
        data: service,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Service fetch error:', error)

    return Response.json<ApiErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          reference: `ERR_${Date.now()}`,
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    )
  }
}
```

---

## 5. Error Handling Patterns

### Pattern 1: Server Component with notFound()

```typescript
// src/app/[locale]/marketplace/[serviceId]/page.tsx
import { notFound } from 'next/navigation'

export default async function ServicePage({
  params: { serviceId, locale },
}: {
  params: { serviceId: string; locale: string }
}) {
  try {
    const service = await getService(serviceId)

    if (!service) {
      notFound() // Renders src/app/[locale]/marketplace/[serviceId]/not-found.tsx
    }

    return <ServiceDetail service={service} />
  } catch (error) {
    console.error('Service page error:', error)
    throw error // Renders src/app/[locale]/error.tsx
  }
}
```

---

### Pattern 2: Client Component with Error Boundary + ErrorFallback

```typescript
// src/app/[locale]/marketplace/page.tsx
'use client'

import { Suspense, useState, useEffect } from 'react'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { ErrorFallback } from '@/components/error/ErrorFallback'

function ServiceGridContent() {
  const [services, setServices] = useState([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch('/api/marketplace/services/search')
        const result = await response.json()

        if (!result.success) {
          setError(result.error.message)
          return
        }

        setServices(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    loadServices()
  }, [])

  if (error) {
    return <ErrorFallback error={error} />
  }

  return <ServiceGrid services={services} />
}

export default function MarketplacePage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback title="Marketplace Error" />}>
      <Suspense fallback={<div>Loading...</div>}>
        <ServiceGridContent />
      </Suspense>
    </ErrorBoundary>
  )
}
```

---

### Pattern 3: Form Validation with ErrorFallback

```typescript
// src/components/BookingForm.tsx
'use client'

import { useState } from 'react'
import { ErrorFallback } from '@/components/error/ErrorFallback'

interface BookingFormProps {
  serviceId: string
  locale: string
}

export function BookingForm({ serviceId, locale }: BookingFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    try {
      // Validate form data
      const bookingDate = formData.get('bookingDate') as string
      const quantity = parseInt(formData.get('quantity') as string)

      if (!bookingDate || isNaN(quantity) || quantity < 1) {
        setError('Please fill in all required fields')
        return
      }

      // Submit booking
      const response = await fetch('/api/marketplace/bookings/create', {
        method: 'POST',
        body: JSON.stringify({
          serviceId,
          bookingDate,
          quantity,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error.message)
        return
      }

      // Success - redirect
      window.location.href = `/${locale}/payment-success`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <ErrorFallback
        error={error}
        title="Booking Error"
        actionLabel="Dismiss"
        actionHref={`/${locale}/marketplace/${serviceId}`}
      />
    )
  }

  return (
    <form onSubmit={(e) => handleSubmit(new FormData(e.currentTarget))}>
      {/* Form fields */}
    </form>
  )
}
```

---

## 6. Error Codes Reference

### Common Marketplace Error Codes

| Code | HTTP | Meaning | Solution |
|------|------|---------|----------|
| `SERVICE_NOT_FOUND` | 404 | Service ID doesn't exist | Show not-found page |
| `INVALID_SERVICE_ID` | 400 | Missing/invalid service ID | Validate form |
| `BOOKING_FAILED` | 400 | Cannot create booking | Check availability |
| `INSUFFICIENT_FUNDS` | 402 | Payment declined | Update payment method |
| `PAYMENT_FAILED` | 402 | Payment processing error | Retry or contact support |
| `PROVIDER_UNVERIFIED` | 403 | Provider not verified | Show verification notice |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down | Show retry option |
| `INVALID_BOOKING_DATE` | 400 | Date not available | Choose different date |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error | Contact support |

---

## 7. Logging & Monitoring

### Recommended Logging Strategy

```typescript
// src/lib/errorLogger.ts
export interface ErrorLog {
  code: string
  message: string
  timestamp: number
  userId?: string
  context: Record<string, any>
  stackTrace?: string
  reference: string
}

export async function logError(log: ErrorLog) {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${log.code}]`, log.message, log.context)
    }

    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (process.env.NEXT_PUBLIC_ERROR_TRACKING_ENABLED === 'true') {
      await fetch('/api/logs/errors', {
        method: 'POST',
        body: JSON.stringify(log),
      })
    }

    // Store in database for analytics
    // await storeErrorLog(log)
  } catch (err) {
    console.error('Failed to log error:', err)
  }
}

// Usage in API
try {
  // ... api code
} catch (error) {
  await logError({
    code: 'SERVICE_FETCH_ERROR',
    message: error instanceof Error ? error.message : 'Unknown error',
    timestamp: Date.now(),
    userId: user?.id,
    context: { serviceId, locale },
    stackTrace: error instanceof Error ? error.stack : undefined,
    reference: `ERR_${Date.now()}`,
  })
}
```

---

## 8. Testing Error Handling

### Test Cases to Implement

1. **Global Error Pages**
   - [ ] Navigate to non-existent route → Shows 404 page
   - [ ] Trigger error in component → Shows error.tsx
   - [ ] Check RTL for Arabic locale

2. **Marketplace Error Pages**
   - [ ] Visit non-existent service → Shows service not-found
   - [ ] Fail payment → Shows payment-error page
   - [ ] Check error details are displayed

3. **Error Components**
   - [ ] ErrorBoundary catches component errors
   - [ ] ErrorFallback displays with custom text
   - [ ] Retry button works
   - [ ] Support button links correctly

4. **API Errors**
   - [ ] Invalid request → 400 error
   - [ ] Resource not found → 404 error
   - [ ] Server error → 500 error
   - [ ] Error codes match documentation

---

## 9. Checklist for Implementation

### Phase 1: Foundation (DONE) ✅
- [x] Global error pages with i18n (error.tsx, not-found.tsx, 500.tsx)
- [x] ErrorBoundary component
- [x] ErrorFallback component

### Phase 2: Marketplace Pages (DONE) ✅
- [x] Service not-found page
- [x] Payment error page

### Phase 3: Integration (TODO)
- [ ] Add error handling to all marketplace API endpoints
- [ ] Add error boundaries to all marketplace pages
- [ ] Implement error logging service
- [ ] Test all error cases

### Phase 4: Monitoring (TODO)
- [ ] Set up error tracking service (Sentry/LogRocket)
- [ ] Create error dashboard
- [ ] Set up alerts for critical errors

---

## 10. Next Steps

1. **Deploy error pages** to production
2. **Add to marketplace pages**:
   ```tsx
   <ErrorBoundary falback={<ErrorFallback />}>
     <MarketplaceFeature />
   </ErrorBoundary>
   ```
3. **Create error tracking dashboard** in admin panel
4. **Monitor error rates** and adjust UX based on trends
5. **Add more specific error pages** as needed

---

## Quick Reference Links

- **Error Pages**: `src/app/[locale]/`
  - `error.tsx` - Global error boundary
  - `not-found.tsx` - 404 page
  - `500.tsx` - Server errors
  - `marketplace/[serviceId]/not-found.tsx` - Service not found
  - `payment-error/page.tsx` - Payment errors

- **Components**: `src/components/error/`
  - `ErrorBoundary.tsx` - React error boundary
  - `ErrorFallback.tsx` - Reusable error display

- **Types**: `src/types/`
  - Add `api.ts` for ApiErrorResponse, ApiSuccessResponse

---

**Last Updated**: 2024  
**Status**: Ready for implementation

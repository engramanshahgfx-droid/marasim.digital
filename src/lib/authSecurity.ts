/**
 * Rate Limiting and Security Utilities for Authentication
 * Implements request throttling, IP-based rate limiting, and other security measures
 */

const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number // in milliseconds
  message?: string
}

// Default configurations
export const RATE_LIMITS = {
  // Generate OTP: 5 requests per 15 minutes per identifier
  sendOTP: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many verification attempts. Please try again later.',
  },

  // Verify OTP: 10 attempts per 30 minutes per identifier
  verifyOTP: {
    maxAttempts: 10,
    windowMs: 30 * 60 * 1000,
    message: 'Too many verification attempts. Please request a new code.',
  },

  // Resend OTP: 3 requests per 5 minutes per identifier
  resendOTP: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000,
    message: 'Too many resend attempts. Please wait before trying again.',
  },

  // Login: 5 attempts per 15 minutes
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000, message: 'Too many login attempts. Please try again later.' },

  // Registration: 3 new registrations per hour per IP
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Too many registration attempts. Please try again later.',
  },
}

/**
 * Get client identifier (IP address or fallback)
 * In production, use X-Forwarded-For header behind reverse proxy
 */
export function getClientIdentifier(email?: string, phone?: string, ipAddress?: string): string {
  // Prefer email/phone since they're more reliable identifiers
  if (email) return `email:${email.toLowerCase().substring(0, 100)}`
  if (phone) return `phone:${phone.substring(0, 100)}`
  return `ip:${ipAddress || 'unknown'}`
}

/**
 * Check if request is rate limited
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const existing = rateLimitStore.get(identifier)

  // Clean up old entries
  if (existing && existing.resetTime <= now) {
    rateLimitStore.delete(identifier)
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs,
    }
  }

  // First attempt in new window
  if (!existing) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Increment attempts
  existing.attempts++

  const allowed = existing.attempts <= config.maxAttempts
  const remaining = Math.max(0, config.maxAttempts - existing.attempts)

  return {
    allowed,
    remaining,
    resetTime: existing.resetTime,
  }
}

/**
 * Reset rate limit for an identifier (call after successful verification)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return ''

  return input.trim().substring(0, maxLength).replace(/[<>]/g, '') // Remove potential HTML tags
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim().toLowerCase()) && email.length <= 254
}

/**
 * Validate phone number format (basic)
 * Expects formats like: +1234567890, 0123456789, etc.
 */
export function isValidPhoneFormat(phone: string): boolean {
  const cleaned = phone.replace(/[^\d+]/g, '')
  // Basic validation: +[1-15 digits] or just digits
  return /^\+?[0-9]{6,15}$/.test(cleaned)
}

/**
 * Hash sensitive data for logging (show only last 4 chars)
 */
export function maskSensitiveData(data: string, showLast: number = 4): string {
  if (data.length <= showLast) return '****'
  return '*'.repeat(data.length - showLast) + data.slice(-showLast)
}

/**
 * Validate OTP code format
 */
export function isValidOTPFormat(code: string): boolean {
  // 6 digits (or 4-8 digits for flexibility)
  return /^[0-9]{4,8}$/.test(code.trim())
}

/**
 * Secure environment variable check
 */
export function checkRequiredEnvVars(vars: string[]): { valid: boolean; missing: string[] } {
  const missing = vars.filter((v) => !process.env[v])
  return { valid: missing.length === 0, missing }
}

/**
 * Log security event (without exposing sensitive data)
 */
export function logSecurityEvent(
  eventType: string,
  details: {
    identifier?: string
    ip?: string
    userAgent?: string
    error?: string
    success?: boolean
  }
): void {
  const timestamp = new Date().toISOString()
  const maskedIdentifier = details.identifier ? maskSensitiveData(details.identifier) : 'unknown'

  console.info(`[SECURITY] ${timestamp} - ${eventType}`, {
    identifier: maskedIdentifier,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent?.substring(0, 100),
    error: details.error,
    success: details.success,
  })
}

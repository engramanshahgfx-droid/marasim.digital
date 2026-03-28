/**
 * Hydration Mismatch Suppression
 * Fixes hydration warnings caused by browser extensions (Grammarly, etc.)
 *
 * Browser extensions can add attributes like `cz-shortcut-listen="true"`
 * which causes React hydration mismatches between server and client HTML
 */

const IGNORED_HYDRATION_ATTRIBUTES = [
  'cz-shortcut-listen', // Grammarly extension
  'data-grammarly-id', // Grammarly
  'data-gramm', // Grammarly
  'data-gramm_editor', // Grammarly
  'data-gramm_id', // Grammarly
  'spellcheck', // Browser default
]

/**
 * Suppress hydration warnings from browser extensions
 * Call this in a useEffect with empty dependency array on root layout
 *
 * @example
 * useEffect(() => {
 *   suppressHydrationWarning()
 * }, [])
 */
export function suppressHydrationWarning() {
  if (typeof window === 'undefined') return

  // Store original console.error
  const originalError = console.error

  // Override console.error to filter hydration warnings
  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString?.() || ''

    // Ignore hydration mismatch warnings from known extensions
    if (errorMessage.includes('hydrated') && IGNORED_HYDRATION_ATTRIBUTES.some((attr) => errorMessage.includes(attr))) {
      return
    }

    // Call original error for everything else
    originalError.apply(console, args)
  }
}

/**
 * Alternative: Use in layout to suppress on specific elements
 * Add to <html> element:
 * suppressHydrationWarning={true}
 *
 * This tells React to skip hydration validation for this element tree
 */
export const LayoutHydrationConfig = {
  // Add suppressHydrationWarning to html/body tags in your root layout
  htmlProps: {
    suppressHydrationWarning: true,
  },
  bodyProps: {
    suppressHydrationWarning: true,
  },
}

/**
 * Recommended: Add to root layout client component
 */

import { useEffect } from 'react'

export function HydrationMismatchHandler() {
  useEffect(() => {
    suppressHydrationWarning()
  }, [])

  return null
}

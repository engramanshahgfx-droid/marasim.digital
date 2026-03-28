// Excel/CSV upload handler for guest lists
// Location: src/lib/guestUploadService.ts

import { parse } from 'papaparse'

export interface GuestRecord {
  name: string
  email?: string
  phone?: string
  plus_ones?: number
  notes?: string
}

/**
 * Parse CSV file content
 */
export async function parseCSV(fileContent: string): Promise<GuestRecord[]> {
  return new Promise((resolve, reject) => {
    parse(fileContent, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        const guests = (results.data as any[]).map((row) => ({
          name: row.name || row.Name || '',
          email: row.email || row.Email || row.email_address || '',
          phone: row.phone || row.Phone || row.phone_number || '',
          plus_ones: parseInt(row.plus_ones || row['Plus Ones'] || '0') || 0,
          notes: row.notes || row.Notes || '',
        }))

        resolve(guests.filter((g) => g.name.trim()))
      },
      error: (error) => reject(new Error(`CSV parsing error: ${error.message}`)),
    })
  })
}

/**
 * Parse XLSX file (requires converting to CSV first in browser)
 * For server-side, we'd use xlsx library
 */
export async function parseXLSX(arrayBuffer: ArrayBuffer): Promise<GuestRecord[]> {
  try {
    // Dynamic import to avoid adding dependency if not needed
    const XLSX = await import('xlsx')

    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      throw new Error('No sheets found in workbook')
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

    const guests = jsonData.map((row) => ({
      name: row.name || row.Name || row.guest_name || '',
      email: row.email || row.Email || row.email_address || '',
      phone: row.phone || row.Phone || row.phone_number || '',
      plus_ones: parseInt(row.plus_ones || row['Plus Ones'] || '0') || 0,
      notes: row.notes || row.Notes || '',
    }))

    return guests.filter((g) => g.name.trim())
  } catch (error) {
    throw new Error(`XLSX parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate guest records
 */
export function validateGuestRecords(guests: GuestRecord[]): {
  valid: GuestRecord[]
  errors: Array<{ row: number; error: string }>
} {
  const valid: GuestRecord[] = []
  const errors: Array<{ row: number; error: string }> = []

  guests.forEach((guest, index) => {
    if (!guest.name || guest.name.trim().length === 0) {
      errors.push({ row: index + 1, error: 'Name is required' })
      return
    }

    if (guest.plus_ones < 0) {
      errors.push({ row: index + 1, error: 'Plus ones cannot be negative' })
      return
    }

    if (guest.email && !isValidEmail(guest.email)) {
      errors.push({ row: index + 1, error: `Invalid email: ${guest.email}` })
      return
    }

    valid.push(guest)
  })

  return { valid, errors }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Detect file format from file extension or content
 */
export function detectFileFormat(filename: string): 'csv' | 'xlsx' | 'xls' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'csv':
      return 'csv'
    case 'xlsx':
      return 'xlsx'
    case 'xls':
      return 'xls'
    default:
      return 'unknown'
  }
}

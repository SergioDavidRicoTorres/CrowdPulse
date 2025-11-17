import Papa from 'papaparse'

export interface CSVRow {
  [key: string]: string
}

export function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as CSVRow[])
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export function normalizeGuestData(row: CSVRow): {
  api_id: string | null
  name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone_number: string | null
  ticket_type: string | null
  raw_data: Record<string, unknown>
} {
  // Try to find columns (case-insensitive)
  const apiIdKey = Object.keys(row).find(
    (key) => key.toLowerCase() === 'api_id' || key.toLowerCase().includes('api id')
  )
  const nameKey = Object.keys(row).find(
    (key) => key.toLowerCase() === 'name' && !key.toLowerCase().includes('first') && !key.toLowerCase().includes('last')
  )
  const firstNameKey = Object.keys(row).find(
    (key) => key.toLowerCase() === 'first_name' || key.toLowerCase().includes('first name')
  )
  const lastNameKey = Object.keys(row).find(
    (key) => key.toLowerCase() === 'last_name' || key.toLowerCase().includes('last name')
  )
  const emailKey = Object.keys(row).find((key) => key.toLowerCase().includes('email'))
  const phoneKey = Object.keys(row).find(
    (key) => key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')
  )
  const ticketKey = Object.keys(row).find(
    (key) => key.toLowerCase().includes('ticket') || key.toLowerCase().includes('type')
  )

  const rawData: Record<string, unknown> = {}
  Object.keys(row).forEach((key) => {
    rawData[key] = row[key]
  })

  return {
    api_id: apiIdKey ? row[apiIdKey]?.trim() || null : null,
    name: nameKey ? row[nameKey]?.trim() || null : null,
    first_name: firstNameKey ? row[firstNameKey]?.trim() || null : null,
    last_name: lastNameKey ? row[lastNameKey]?.trim() || null : null,
    email: emailKey ? row[emailKey]?.trim() || null : null,
    phone_number: phoneKey ? row[phoneKey]?.trim() || null : null,
    ticket_type: ticketKey ? row[ticketKey]?.trim() || null : null,
    raw_data: rawData,
  }
}


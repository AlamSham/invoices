 // Shared date utilities for rental invoices

// Returns inclusive day count between start and end dates (YYYY-MM-DD or ISO strings)
// Example: start=2025-01-01, end=2025-01-01 => 1 day
export const daysBetween = (start?: string, end?: string): number => {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(0, diff)
}

// Adds N days to a given date string (YYYY-MM-DD or ISO) and returns YYYY-MM-DD
export const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + (Number(days) || 0))
  // format back to YYYY-MM-DD
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

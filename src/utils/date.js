/**
 * Dates as the Fund Snapshot collections store them.
 *
 * A snapshot date is a day, not a moment: it comes from the workbook's file
 * name and is written at UTC midnight. Reading it back in the browser's zone
 * would move it — east of UTC nothing changes, west of it every date lands on
 * the day before — so both helpers work in UTC and never go through the local
 * calendar.
 */

/** ISO timestamp or `YYYY-MM-DD` → `YYYY-MM-DD`, which is what the APIs take. */
export const toDateKey = value => {
  if (!value) return ''
  const text = String(value)
  // Already a plain day — the score rows keep `launchDate` as one.
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** `2026-08-06` → `06 Aug 2026`. Anything unreadable comes back as an em dash. */
export const formatDate = value => {
  const key = toDateKey(value)
  if (!key) return '—'
  const [year, month, day] = key.split('-')
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`
}

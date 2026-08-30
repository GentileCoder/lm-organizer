import { DAYS, MONTHS_L } from './constants.js'

export function fmtCurrency(n) {
  return (
    '€' +
    Number(n)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  )
}

/** YYYY-MM-DD in local time (never toISOString — that shifts by timezone offset). */
export function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayStr() {
  return dateStr(new Date())
}

export function fmtTime(t) {
  if (!t || !t.includes(':')) return ''
  const [h, m] = t.split(':')
  if (h === undefined || m === undefined) return ''
  const ap = +h >= 12 ? 'pm' : 'am'
  return `${+h % 12 || 12}:${m}${ap}`
}

export function fmtDateLabel(ds) {
  const d = new Date(ds + 'T12:00:00')
  return `${DAYS[d.getDay()]}, ${MONTHS_L[d.getMonth()]} ${d.getDate()}`
}

export function urlDomain(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

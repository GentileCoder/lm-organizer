import { DEFAULT_EVENT_CATEGORIES, RECURRENCE_OPTIONS } from './constants.js'

export function isRecurringOn(event, ds) {
  if (!event.recurring || event.recurring === 'none') return false
  if (ds < event.date) return false
  if (event.exceptions && event.exceptions.includes(ds)) return false

  const start = new Date(event.date + 'T12:00:00')
  const target = new Date(ds + 'T12:00:00')
  const dow = target.getDay()

  switch (event.recurring) {
    case 'daily':
      return true
    case 'workdays':
      return dow >= 1 && dow <= 5
    case 'weekly':
      return dow === start.getDay()
    case 'biweekly': {
      if (dow !== start.getDay()) return false
      const diff = Math.round((target - start) / 86400000)
      return diff % 14 === 0
    }
    case 'monthly':
      return start.getDate() === target.getDate()
    default:
      return false
  }
}

/** Every event that occurs on `ds`, including recurring occurrences, sorted by time. */
export function eventsForDate(events, ds) {
  const result = []
  events.forEach(e => {
    if (e.date === ds) result.push(e)
    else if (e.recurring && e.recurring !== 'none' && isRecurringOn(e, ds)) result.push(e)
  })
  return result.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
}

export function evtColor(categories, categoryName) {
  const cats = categories && categories.length ? categories : DEFAULT_EVENT_CATEGORIES
  return (cats.find(c => c.name === categoryName) || { color: '#888888' }).color
}

export function recurLabel(value) {
  const o = RECURRENCE_OPTIONS.find(o => o.value === value)
  return o && o.value !== 'none' ? o.label : ''
}

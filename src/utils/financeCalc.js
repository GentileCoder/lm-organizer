import { todayStr } from './format.js'

export function toMonthly(amount, freq) {
  if (freq === 'daily') return (amount * 365) / 12
  if (freq === 'weekly') return (amount * 52) / 12
  if (freq === 'yearly') return amount / 12
  return amount
}

export function totalMonthlyIncome(finance) {
  return (finance.incomeSources || []).reduce((s, src) => s + toMonthly(src.amount, src.frequency), 0)
}

export function expInMonth(exp, y, m) {
  if (exp.recurring === 'one-time') {
    const ms = `${y}-${String(m + 1).padStart(2, '0')}`
    return (exp.startDate || '').startsWith(ms)
  }
  if (exp.recurring === 'monthly') return true
  if (!exp.startDate) return false
  const sd = new Date(exp.startDate)
  const diff = y * 12 + m - (sd.getFullYear() * 12 + sd.getMonth())
  if (diff < 0) return false
  return diff % ({ quarterly: 3, biannual: 6, yearly: 12 }[exp.recurring] || 1) === 0
}

export function minijobForMonth(finance, y, m) {
  const ms = `${y}-${String(m + 1).padStart(2, '0')}`
  return (finance.minijob || []).filter(b => b.date.startsWith(ms)).reduce((s, b) => s + b.amount, 0)
}

/** Income, expenses, balance, and the matching expense rows for month (y, m). */
export function monthSummary(finance, y, m) {
  const inc = totalMonthlyIncome(finance) + minijobForMonth(finance, y, m)
  const exps = (finance.expenses || []).filter(e => expInMonth(e, y, m))
  const exp = exps.reduce((s, e) => s + e.amount, 0)
  return { inc, exp, bal: inc - exp, exps }
}

/**
 * Upgrades older finance data shapes in place, on load, so data saved by a previous
 * version of the app (flat `transactions`, a single `salary` figure, `bull` casual-income
 * entries) keeps working. Ported verbatim from legacy `finMigrate()` — safe to call every
 * load; each branch is guarded by its own one-time flag.
 */
export function migrateFinance(finance) {
  if (!finance.minijob) finance.minijob = []
  if (finance.bull && !finance._bullMigrated) {
    finance.minijob = [...finance.bull]
    finance._bullMigrated = true
  }
  if (finance.salary > 0 && !finance._incMigrated) {
    finance.incomeSources.push({ id: 'inc' + Date.now(), name: 'Salary', amount: finance.salary, frequency: 'monthly' })
    finance._incMigrated = true
  }
  if (finance.transactions && finance.transactions.length && !finance._txMigrated) {
    const recMap = {
      monthly: 'monthly',
      bimonthly: 'quarterly',
      quarterly: 'quarterly',
      biannual: 'biannual',
      yearly: 'yearly',
    }
    finance.transactions.forEach(tx => {
      if (tx.type !== 'expense') return
      finance.expenses.push({
        id: 'exp' + Date.now() + Math.random(),
        category: tx.category || 'Other',
        amount: tx.amount,
        description: tx.description || '',
        withdrawDay: parseInt((tx.date || '').split('-')[2]) || null,
        recurring: recMap[tx.recurring] || 'one-time',
        startDate: tx.date || todayStr(),
      })
    })
    finance._txMigrated = true
  }
}

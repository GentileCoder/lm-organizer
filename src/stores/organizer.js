import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { getOrganizer, saveOrganizer } from '../services/organizerApi.js'
import { migrateFinance } from '../utils/financeCalc.js'
import { DEFAULT_EVENT_CATEGORIES } from '../utils/constants.js'
import { todayStr } from '../utils/format.js'

function defaultData() {
  return {
    tasks: [{ id: 1, text: 'Review patent pipeline config', done: false }],
    notes: [{ id: 1, text: 'El Toro: check BONit invoice export', done: false }],
    goals: [{ id: 1, text: 'Ship confidentiality system v2', plan: '', tasks: [] }],
    shopping: [],
    events: [],
    finance: {
      incomeSources: [],
      expenseCategories: ['Housing', 'Food', 'Transport', 'Health', 'Entertainment', 'Utilities', 'Other'],
      expenses: [],
      minijob: [],
      salary: 0,
      transactions: [],
      budgets: {},
    },
    review: [],
    eventCategories: [...DEFAULT_EVENT_CATEGORIES],
    investments: [],
  }
}

/** Fills in anything missing/old-shaped so every view can assume a complete shape. Ported from legacy `safeD()`. */
function normalize(d) {
  if (!d.finance) d.finance = {}
  if (!d.finance.incomeSources) d.finance.incomeSources = []
  if (!d.finance.expenseCategories) {
    d.finance.expenseCategories = ['Housing', 'Food', 'Transport', 'Health', 'Entertainment', 'Utilities', 'Other']
  }
  if (!d.finance.expenses) d.finance.expenses = []
  if (!d.finance.transactions) d.finance.transactions = []
  if (!d.finance.budgets) d.finance.budgets = {}
  if (!d.review) d.review = []
  if (!d.events) d.events = []
  if (!d.tasks) d.tasks = []
  if (!d.notes) d.notes = []
  if (!d.goals) d.goals = []
  if (!d.shopping) d.shopping = []

  // Migrate the old flat-items shopping list into the current named-lists shape.
  if (d.shopping.length > 0 && d.shopping[0].text !== undefined) {
    d.shopping = [{ id: Date.now(), name: 'Shopping', items: d.shopping }]
  }
  d.shopping.forEach(c => {
    if (!c.items) c.items = []
  })

  if (!d.eventCategories) d.eventCategories = [...DEFAULT_EVENT_CATEGORIES]
  if (!d.investments) d.investments = []
  d.goals.forEach(g => {
    if (!g.tasks) g.tasks = []
    if (g.plan === undefined) g.plan = ''
  })

  migrateFinance(d.finance)
  return d
}

export const useOrganizerStore = defineStore('organizer', () => {
  const data = reactive(defaultData())
  const status = ref('idle') // idle | loading | saving | synced | error
  const errorMessage = ref('')
  let saveTimer = null

  async function load() {
    status.value = 'loading'
    errorMessage.value = ''
    try {
      const remote = await getOrganizer()
      if (remote && Object.keys(remote).length > 0) Object.assign(data, remote)
      normalize(data)
      status.value = 'synced'
    } catch (e) {
      status.value = 'error'
      errorMessage.value = e.message
    }
  }

  async function persistNow() {
    status.value = 'saving'
    try {
      await saveOrganizer(data)
      status.value = 'synced'
    } catch (e) {
      status.value = 'error'
      errorMessage.value = e.message
    }
  }

  /** Every mutation calls this — coalesces bursts of edits (e.g. rapid toggles) into one request. */
  function persist() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(persistNow, 400)
  }

  // ── Tasks / Notes (Workspace) ──
  function addWorkspaceItem(section, text) {
    data[section].push({ id: Date.now(), text, done: false })
    persist()
  }
  function toggleWorkspaceItem(section, id) {
    const item = data[section].find(i => i.id === id)
    if (item) item.done = !item.done
    persist()
  }
  function deleteWorkspaceItem(section, id) {
    data[section] = data[section].filter(i => i.id !== id)
    persist()
  }

  // ── Review ──
  function addReview(text) {
    data.review.unshift({ id: Date.now(), text, date: todayStr() })
    persist()
  }
  function deleteReview(id) {
    data.review = data.review.filter(r => r.id !== id)
    persist()
  }

  // ── Goals ──
  function addGoal(text) {
    const goal = { id: Date.now(), text, plan: '', tasks: [] }
    data.goals.push(goal)
    persist()
    return goal
  }
  function deleteGoal(id) {
    data.goals = data.goals.filter(g => g.id !== id)
    persist()
  }
  function saveGoalPlan(goalId, plan) {
    const g = data.goals.find(g => g.id === goalId)
    if (g) g.plan = plan
    persist()
  }
  function addGoalTask(goalId, text) {
    const g = data.goals.find(g => g.id === goalId)
    if (!g) return
    if (!g.tasks) g.tasks = []
    g.tasks.push({ id: Date.now(), text, done: false })
    persist()
  }
  function toggleGoalTask(goalId, taskId) {
    const g = data.goals.find(g => g.id === goalId)
    const t = g?.tasks.find(t => t.id === taskId)
    if (t) t.done = !t.done
    persist()
  }
  function deleteGoalTask(goalId, taskId) {
    const g = data.goals.find(g => g.id === goalId)
    if (g) g.tasks = g.tasks.filter(t => t.id !== taskId)
    persist()
  }

  // ── Shopping ──
  function addShoppingList(name) {
    const list = { id: Date.now(), name, items: [] }
    data.shopping.push(list)
    persist()
    return list
  }
  function deleteShoppingList(id) {
    data.shopping = data.shopping.filter(c => c.id !== id)
    persist()
  }
  function renameShoppingList(id, name) {
    const c = data.shopping.find(c => c.id === id)
    if (c) c.name = name
    persist()
  }
  function addShoppingItem(listId, { text, price, url }) {
    const c = data.shopping.find(c => c.id === listId)
    if (!c) return
    // price is already normalized by the caller (number, or '' for blank) — don't
    // fall back on falsy-ness here, or a legitimately entered 0 gets wiped to ''.
    c.items.push({ id: Date.now(), text, done: false, price: price ?? '', url: url || '' })
    persist()
  }
  function toggleShoppingItem(listId, itemId) {
    const c = data.shopping.find(c => c.id === listId)
    const item = c?.items.find(i => i.id === itemId)
    if (item) item.done = !item.done
    persist()
  }
  function deleteShoppingItem(listId, itemId) {
    const c = data.shopping.find(c => c.id === listId)
    if (c) c.items = c.items.filter(i => i.id !== itemId)
    persist()
  }
  function saveShoppingItem(listId, itemId, { text, price, url }) {
    const c = data.shopping.find(c => c.id === listId)
    const idx = c?.items.findIndex(i => i.id === itemId)
    if (c && idx > -1) c.items[idx] = { ...c.items[idx], text, price: price ?? '', url: url || '' }
    persist()
  }

  // ── Calendar: events ──
  function addEvent({ date, time, title, category, recurring }) {
    data.events.push({
      id: Date.now(),
      date,
      time: time || '',
      title,
      category,
      recurring: recurring || 'none',
      exceptions: [],
    })
    data.events.sort((a, b) => a.date.localeCompare(b.date))
    persist()
  }
  function saveEvent(id, { title, time, category, recurring }) {
    const idx = data.events.findIndex(e => e.id === id)
    if (idx > -1) data.events[idx] = { ...data.events[idx], title, time: time || '', category, recurring }
    persist()
  }
  function deleteEventOccurrence(id, ds) {
    const e = data.events.find(e => e.id === id)
    if (!e) return
    if (!e.exceptions) e.exceptions = []
    e.exceptions.push(ds)
    persist()
  }
  function deleteEventSeries(id) {
    data.events = data.events.filter(e => e.id !== id)
    persist()
  }

  // ── Calendar: categories ──
  function addEventCategory(name, color) {
    if (data.eventCategories.find(c => c.name === name)) return
    data.eventCategories.push({ name, color })
    persist()
  }
  function deleteEventCategory(name) {
    data.eventCategories = data.eventCategories.filter(c => c.name !== name)
    persist()
  }
  function saveEventCategory(originalName, { name, color }) {
    data.eventCategories = data.eventCategories.map(c => (c.name === originalName ? { name, color } : c))
    data.events = data.events.map(e => (e.category === originalName ? { ...e, category: name } : e))
    persist()
  }

  // ── Finance: income sources ──
  function addIncomeSource({ name, amount, frequency }) {
    data.finance.incomeSources.push({ id: 'inc' + Date.now(), name, amount, frequency })
    persist()
  }
  function deleteIncomeSource(id) {
    data.finance.incomeSources = data.finance.incomeSources.filter(s => s.id !== id)
    persist()
  }

  // ── Finance: minijob (casual income log) ──
  function addMinijob({ date, amount, description }) {
    data.finance.minijob.push({ id: 'minijob' + Date.now(), date, amount, description })
    persist()
  }
  function deleteMinijob(id) {
    data.finance.minijob = data.finance.minijob.filter(b => b.id !== id)
    persist()
  }

  // ── Finance: expenses ──
  function addExpenseCategory(name) {
    if (!data.finance.expenseCategories.includes(name)) data.finance.expenseCategories.push(name)
    persist()
  }
  function deleteExpenseCategory(name) {
    data.finance.expenseCategories = data.finance.expenseCategories.filter(c => c !== name)
    persist()
  }
  function addExpense({ category, amount, description, withdrawDay, recurring, startDate }) {
    data.finance.expenses.push({
      id: 'exp' + Date.now(),
      category,
      amount,
      description: description || '',
      withdrawDay: withdrawDay || null,
      recurring,
      startDate,
    })
    persist()
  }
  function saveExpense(id, { category, amount, description, withdrawDay, recurring, startDate }) {
    const idx = data.finance.expenses.findIndex(e => e.id === id)
    if (idx > -1) {
      data.finance.expenses[idx] = {
        ...data.finance.expenses[idx],
        category,
        amount,
        description: description || '',
        withdrawDay: withdrawDay || null,
        recurring,
        startDate,
      }
    }
    persist()
  }
  function deleteExpense(id) {
    data.finance.expenses = data.finance.expenses.filter(e => e.id !== id)
    persist()
  }

  // ── Investments ──
  function saveInvestmentAnalysis(result) {
    data.investments.push({ ...result, id: Date.now(), date: todayStr() })
    persist()
  }
  function deleteInvestment(id) {
    data.investments = data.investments.filter(i => i.id !== id)
    persist()
  }

  return {
    data,
    status,
    errorMessage,
    load,
    addWorkspaceItem,
    toggleWorkspaceItem,
    deleteWorkspaceItem,
    addReview,
    deleteReview,
    addGoal,
    deleteGoal,
    saveGoalPlan,
    addGoalTask,
    toggleGoalTask,
    deleteGoalTask,
    addShoppingList,
    deleteShoppingList,
    renameShoppingList,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    saveShoppingItem,
    addEvent,
    saveEvent,
    deleteEventOccurrence,
    deleteEventSeries,
    addEventCategory,
    deleteEventCategory,
    saveEventCategory,
    addIncomeSource,
    deleteIncomeSource,
    addMinijob,
    deleteMinijob,
    addExpenseCategory,
    deleteExpenseCategory,
    addExpense,
    saveExpense,
    deleteExpense,
    saveInvestmentAnalysis,
    deleteInvestment,
  }
})

<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { fmtCurrency, todayStr } from '../../utils/format.js'
import { MONTHS_L, MONTHS_S } from '../../utils/constants.js'

const organizerStore = useOrganizerStore()
const now = new Date()
const minijob = computed(() => organizerStore.data.finance.minijob)

const date = ref(todayStr())
const amount = ref('')
const description = ref('Salary')

const weekTotal = computed(() => {
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dow)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  return minijob.value
    .filter(b => {
      const d = new Date(b.date + 'T12:00:00')
      return d >= weekStart && d < weekEnd
    })
    .reduce((s, b) => s + b.amount, 0)
})
const monthTotal = computed(() => {
  const ms = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return minijob.value.filter(b => b.date.startsWith(ms)).reduce((s, b) => s + b.amount, 0)
})
const yearTotal = computed(() =>
  minijob.value.filter(b => b.date.startsWith(String(now.getFullYear()))).reduce((s, b) => s + b.amount, 0)
)

const months = computed(() => {
  const result = []
  for (let i = 11; i >= 0; i--) {
    let m = now.getMonth() - i
    let y = now.getFullYear()
    if (m < 0) {
      m += 12
      y--
    }
    const ms = `${y}-${String(m + 1).padStart(2, '0')}`
    const total = minijob.value.filter(b => b.date.startsWith(ms)).reduce((s, b) => s + b.amount, 0)
    result.push({ label: MONTHS_S[m], total, isCur: y === now.getFullYear() && m === now.getMonth() })
  }
  return result
})
const maxBar = computed(() => Math.max(...months.value.map(x => x.total), 1))
function barHeight(total) {
  return Math.max(Math.round((total / maxBar.value) * 80), total > 0 ? 2 : 0)
}
const activeMonths = computed(() => months.value.filter(x => x.total > 0))
const avgMonth = computed(() =>
  activeMonths.value.length ? activeMonths.value.reduce((s, x) => s + x.total, 0) / activeMonths.value.length : 0
)
const highestMonth = computed(() => months.value.reduce((max, x) => (x.total > max.total ? x : max), months.value[0]))
const monthEntryCount = computed(() => {
  const ms = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return minijob.value.filter(b => b.date.startsWith(ms)).length
})
const allTimeTotal = computed(() => minijob.value.reduce((s, b) => s + b.amount, 0))
const avgPerEntry = computed(() => (minijob.value.length ? allTimeTotal.value / minijob.value.length : 0))

const rows = computed(() => [...minijob.value].sort((a, b) => b.date.localeCompare(a.date)))

const logM = ref(now.getMonth())
const logY = ref(now.getFullYear())
function navLog(dir) {
  logM.value += dir
  if (logM.value > 11) {
    logM.value = 0
    logY.value++
  }
  if (logM.value < 0) {
    logM.value = 11
    logY.value--
  }
}
const logEntries = computed(() => {
  const ms = `${logY.value}-${String(logM.value + 1).padStart(2, '0')}`
  return rows.value.filter(b => b.date.startsWith(ms))
})
const logTotal = computed(() => logEntries.value.reduce((s, b) => s + b.amount, 0))

function add() {
  const amt = parseFloat(amount.value)
  if (!date.value || !amt) return
  organizerStore.addMinijob({ date: date.value, amount: amt, description: description.value })
  amount.value = ''
}
</script>

<template>
  <div class="sg3" style="margin-bottom: 10px">
    <div class="sc">
      <div class="sl">This week</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(weekTotal) }}</div>
    </div>
    <div class="sc">
      <div class="sl">This month</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(monthTotal) }}</div>
    </div>
    <div class="sc">
      <div class="sl">This year</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(yearTotal) }}</div>
    </div>
  </div>
  <div class="sg3" style="margin-bottom: 14px">
    <div class="sc">
      <div class="sl">Avg / active month</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(avgMonth) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Highest month</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(highestMonth?.total || 0) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Avg / entry</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(avgPerEntry) }}</div>
    </div>
  </div>
  <div class="sg2" style="margin-bottom: 14px">
    <div class="sc">
      <div class="sl">Entries this month</div>
      <div class="sv">{{ monthEntryCount }}</div>
    </div>
    <div class="sc">
      <div class="sl">Total entries</div>
      <div class="sv">{{ minijob.length }}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 12px">Income</div>
    <div style="display: flex; gap: 8px; margin-bottom: 8px">
      <input v-model="date" type="date" style="flex: 1; width: auto" />
      <input v-model="amount" type="number" min="0" step="0.01" placeholder="Amount €" style="flex: 1; width: auto" />
    </div>
    <div style="display: flex; gap: 8px">
      <select v-model="description" style="flex: 1; width: auto">
        <option value="Salary">Salary</option>
        <option value="Tipp">Tipp</option>
      </select>
      <button class="sbtn" @click="add">Add</button>
    </div>
  </div>

  <div class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 12px">12-month chart</div>
    <div class="bars">
      <div v-for="(x, i) in months" :key="i" class="bar-col">
        <div class="bar-wrap">
          <div class="bar" :style="{ height: barHeight(x.total) + 'px' }" :title="fmtCurrency(x.total)"></div>
        </div>
        <span class="bar-label" :style="{ color: x.isCur ? 'var(--color-primary)' : 'var(--color-text-muted)' }">{{
          x.label
        }}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="log-header">
      <span style="font-size: 13px; font-weight: 500">Log</span>
      <div class="log-nav">
        <button class="cal-nav-btn" @click="navLog(-1)">‹</button>
        <span class="log-month-label">{{ MONTHS_L[logM] }} {{ logY }}</span>
        <button class="cal-nav-btn" @click="navLog(1)">›</button>
      </div>
    </div>
    <div v-if="logEntries.length" class="log-group-total-row">
      <span>Total</span>
      <span class="log-group-total">{{ fmtCurrency(logTotal) }}</span>
    </div>
    <p v-if="!logEntries.length" style="font-size: 13px; color: var(--color-text-muted); padding: 8px 0">
      No entries this month.
    </p>
    <div v-for="b in logEntries" :key="b.id" class="log-row">
      <span class="log-date">{{ b.date }}</span>
      <span class="log-desc">{{ b.description }}</span>
      <span class="log-amount">+{{ fmtCurrency(b.amount) }}</span>
      <button class="del-btn" @click="organizerStore.deleteMinijob(b.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.bars {
  display: flex;
  gap: 2px;
  align-items: flex-end;
}
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}
.bar-wrap {
  display: flex;
  align-items: flex-end;
  height: 80px;
}
.bar {
  width: 16px;
  background: var(--color-success);
  border-radius: 2px 2px 0 0;
}
.bar-label {
  font-size: 9px;
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
}
.log-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.log-month-label {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.log-group-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 0 4px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2px;
}
.log-group-total {
  color: var(--color-success);
}
.log-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
}
.log-date {
  font-size: 13px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.log-desc {
  flex: 1;
  font-size: 13px;
  color: #aaa;
}
.log-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-success);
  flex-shrink: 0;
}
</style>

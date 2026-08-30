<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { fmtCurrency, todayStr } from '../../utils/format.js'
import { MONTHS_S } from '../../utils/constants.js'

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
const rows = computed(() => [...minijob.value].sort((a, b) => b.date.localeCompare(a.date)))

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
  <div class="sg2" style="margin-bottom: 14px">
    <div class="sc">
      <div class="sl">Avg / active month</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(avgMonth) }}</div>
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
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px">Log</div>
    <p v-if="!rows.length" style="font-size: 13px; color: var(--color-text-muted); padding: 8px 0">No entries yet.</p>
    <div v-for="b in rows" :key="b.id" class="log-row">
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

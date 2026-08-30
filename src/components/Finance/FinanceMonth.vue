<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { monthSummary, toMonthly } from '../../utils/financeCalc.js'
import { fmtCurrency } from '../../utils/format.js'
import { MONTHS_L, EXPENSE_RECURRENCE_LABELS } from '../../utils/constants.js'

const organizerStore = useOrganizerStore()
const now = new Date()
const finM = ref(now.getMonth())
const finY = ref(now.getFullYear())

const summary = computed(() => monthSummary(organizerStore.data.finance, finY.value, finM.value))
const categoryTotals = computed(() => {
  const totals = {}
  summary.value.exps.forEach(e => (totals[e.category] = (totals[e.category] || 0) + e.amount))
  return Object.entries(totals).sort((a, b) => b[1] - a[1])
})
const incomeSources = computed(() => organizerStore.data.finance.incomeSources || [])

function nav(dir) {
  finM.value += dir
  if (finM.value > 11) {
    finM.value = 0
    finY.value++
  }
  if (finM.value < 0) {
    finM.value = 11
    finY.value--
  }
}
</script>

<template>
  <div class="nav-row">
    <button class="cal-nav-btn" @click="nav(-1)">‹</button>
    <span class="month-label">{{ MONTHS_L[finM] }} {{ finY }}</span>
    <button class="cal-nav-btn" @click="nav(1)">›</button>
  </div>

  <div class="sg3">
    <div class="sc">
      <div class="sl">Income</div>
      <div class="sv" style="color: var(--color-success); font-size: 13px">{{ fmtCurrency(summary.inc) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Expenses</div>
      <div class="sv" style="color: var(--color-danger); font-size: 13px">{{ fmtCurrency(summary.exp) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Balance</div>
      <div
        class="sv"
        :style="{ color: summary.bal >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '13px' }"
      >
        {{ fmtCurrency(summary.bal) }}
      </div>
    </div>
  </div>

  <div v-if="incomeSources.length" class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px">Income sources</div>
    <div v-for="src in incomeSources" :key="src.id" class="income-row">
      <span style="flex: 1; font-size: 13px">{{ src.name }}</span>
      <span style="font-size: 13px; font-weight: 500; color: var(--color-success)"
        >+{{ fmtCurrency(toMonthly(src.amount, src.frequency)) }}</span
      >
    </div>
  </div>

  <div v-if="categoryTotals.length" class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 10px">By category</div>
    <div v-for="[cat, amt] in categoryTotals" :key="cat" class="cat-bar-row">
      <div class="cat-bar-label">
        <span style="color: var(--color-text-muted)">{{ cat }}</span
        ><span>{{ fmtCurrency(amt) }}</span>
      </div>
      <div class="cat-bar-track">
        <div
          class="cat-bar-fill"
          :style="{ width: (summary.exp > 0 ? Math.round((amt / summary.exp) * 100) : 0) + '%' }"
        ></div>
      </div>
    </div>
  </div>

  <div class="card">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px">Expenses</div>
    <p v-if="!summary.exps.length" style="font-size: 13px; color: var(--color-text-muted); padding: 8px 0">
      No expenses this month.
    </p>
    <div v-for="e in summary.exps" :key="e.id" class="expense-row">
      <div style="flex: 1">
        <div style="font-size: 13px">{{ e.description || e.category }}</div>
        <div class="expense-meta">
          {{ e.category
          }}<template v-if="EXPENSE_RECURRENCE_LABELS[e.recurring] && e.recurring !== 'one-time'">
            · <span style="color: var(--color-primary)">↻ {{ EXPENSE_RECURRENCE_LABELS[e.recurring] }}</span></template
          ><template v-if="e.withdrawDay"> · day {{ e.withdrawDay }}</template>
        </div>
      </div>
      <span class="expense-amount">{{ fmtCurrency(e.amount) }}</span>
    </div>
  </div>
</template>

<style scoped>
.nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.month-label {
  font-weight: 500;
  font-size: 15px;
}
.income-row {
  display: flex;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
}
.cat-bar-row {
  margin-bottom: 8px;
}
.cat-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 3px;
}
.cat-bar-track {
  background: var(--color-border);
  border-radius: 4px;
  height: 4px;
}
.cat-bar-fill {
  background: var(--color-danger);
  height: 4px;
  border-radius: 4px;
}
.expense-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
}
.expense-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.expense-amount {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-danger);
}
</style>

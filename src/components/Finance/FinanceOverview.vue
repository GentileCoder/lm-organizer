<script setup>
import { computed } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { monthSummary } from '../../utils/financeCalc.js'
import { fmtCurrency } from '../../utils/format.js'
import { MONTHS_S } from '../../utils/constants.js'

const organizerStore = useOrganizerStore()
const now = new Date()

const months = computed(() => {
  const result = []
  for (let i = 11; i >= 0; i--) {
    let m = now.getMonth() - i
    let y = now.getFullYear()
    if (m < 0) {
      m += 12
      y--
    }
    result.push({ y, m, label: MONTHS_S[m], s: monthSummary(organizerStore.data.finance, y, m) })
  }
  return result
})
const current = computed(() => monthSummary(organizerStore.data.finance, now.getFullYear(), now.getMonth()))
const totalIncome = computed(() => months.value.reduce((s, x) => s + x.s.inc, 0))
const totalExpense = computed(() => months.value.reduce((s, x) => s + x.s.exp, 0))
const savingsRate = computed(() =>
  totalIncome.value > 0 ? Math.round(((totalIncome.value - totalExpense.value) / totalIncome.value) * 100) : 0
)
const maxBar = computed(() => Math.max(...months.value.map(x => Math.max(x.s.inc, x.s.exp)), 1))

function barHeight(value) {
  return Math.max(Math.round((value / maxBar.value) * 80), value > 0 ? 2 : 0)
}
function isCurrentMonth(x) {
  return x.y === now.getFullYear() && x.m === now.getMonth()
}

const categoryTotals = computed(() => {
  const totals = {}
  months.value.forEach(({ s }) => s.exps.forEach(e => (totals[e.category] = (totals[e.category] || 0) + e.amount)))
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
})
</script>

<template>
  <div class="sg2" style="margin-bottom: 10px">
    <div class="sc">
      <div class="sl">Monthly income</div>
      <div class="sv" style="color: var(--color-success)">{{ fmtCurrency(current.inc) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Monthly expenses</div>
      <div class="sv" style="color: var(--color-danger)">{{ fmtCurrency(current.exp) }}</div>
    </div>
  </div>
  <div class="sg2" style="margin-bottom: 14px">
    <div class="sc">
      <div class="sl">Balance / mo</div>
      <div class="sv" :style="{ color: current.bal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }">
        {{ fmtCurrency(current.bal) }}
      </div>
    </div>
    <div class="sc">
      <div class="sl">Savings rate</div>
      <div class="sv" :style="{ color: savingsRate >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }">
        {{ savingsRate }}%
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 12px">12-month chart</div>
    <div class="bars">
      <div v-for="x in months" :key="`${x.y}-${x.m}`" class="bar-col">
        <div class="bar-pair">
          <div class="bar income" :style="{ height: barHeight(x.s.inc) + 'px' }"></div>
          <div class="bar expense" :style="{ height: barHeight(x.s.exp) + 'px' }"></div>
        </div>
        <span
          class="bar-label"
          :style="{ color: isCurrentMonth(x) ? 'var(--color-primary)' : 'var(--color-text-muted)' }"
          >{{ x.label }}</span
        >
      </div>
    </div>
    <div class="legend">
      <span><span class="swatch income"></span>Income</span>
      <span><span class="swatch expense"></span>Expenses</span>
    </div>
  </div>

  <div v-if="categoryTotals.length" class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 10px">Expenses by category (12 mo)</div>
    <div v-for="[cat, amt] in categoryTotals" :key="cat" class="cat-bar-row">
      <div class="cat-bar-label">
        <span style="color: var(--color-text-muted)">{{ cat }}</span
        ><span>{{ fmtCurrency(amt) }}</span>
      </div>
      <div class="cat-bar-track">
        <div
          class="cat-bar-fill"
          :style="{ width: (totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0) + '%' }"
        ></div>
      </div>
    </div>
  </div>

  <div class="card">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 10px">12-month totals</div>
    <div class="total-row">
      <span style="color: var(--color-text-muted)">Total income</span
      ><span style="color: var(--color-success)">{{ fmtCurrency(totalIncome) }}</span>
    </div>
    <div class="total-row">
      <span style="color: var(--color-text-muted)">Total expenses</span
      ><span style="color: var(--color-danger)">{{ fmtCurrency(totalExpense) }}</span>
    </div>
    <div class="total-row" style="border-bottom: none">
      <span style="color: var(--color-text-muted)">Net savings</span
      ><span :style="{ color: totalIncome - totalExpense >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }">{{
        fmtCurrency(totalIncome - totalExpense)
      }}</span>
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
.bar-pair {
  display: flex;
  gap: 1px;
  align-items: flex-end;
  height: 80px;
}
.bar {
  width: 8px;
  border-radius: 2px 2px 0 0;
}
.bar.income {
  background: var(--color-success);
}
.bar.expense {
  background: var(--color-danger);
}
.bar-label {
  font-size: 9px;
}
.legend {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 4px;
}
.swatch.income {
  background: var(--color-success);
}
.swatch.expense {
  background: var(--color-danger);
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
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
}
</style>

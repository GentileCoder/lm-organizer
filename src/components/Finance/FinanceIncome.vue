<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { toMonthly, totalMonthlyIncome } from '../../utils/financeCalc.js'
import { fmtCurrency } from '../../utils/format.js'
import { INCOME_FREQUENCY_LABELS } from '../../utils/constants.js'

const organizerStore = useOrganizerStore()
const sources = computed(() => organizerStore.data.finance.incomeSources)
const total = computed(() => totalMonthlyIncome(organizerStore.data.finance))

const name = ref('')
const amount = ref('')
const frequency = ref('monthly')

function add() {
  const n = name.value.trim()
  const amt = parseFloat(amount.value)
  if (!n || !amt) return
  organizerStore.addIncomeSource({ name: n, amount: amt, frequency: frequency.value })
  name.value = ''
  amount.value = ''
  frequency.value = 'monthly'
}
</script>

<template>
  <div class="sc total-card">
    <div class="sl">Total recurring monthly income</div>
    <div class="total-value">{{ fmtCurrency(total) }}</div>
  </div>

  <div class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 12px">Add income source</div>
    <input v-model="name" type="text" placeholder="Source name (e.g. Salary, Freelance)" style="margin-bottom: 8px" />
    <div style="display: flex; gap: 8px; margin-bottom: 10px">
      <input v-model="amount" type="number" min="0" step="0.01" placeholder="Amount €" style="flex: 1; width: auto" />
      <select v-model="frequency" style="flex: 1; width: auto">
        <option value="monthly">Monthly</option>
        <option value="weekly">Weekly</option>
        <option value="daily">Daily</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
    <button class="add-btn" @click="add">Add source</button>
  </div>

  <div class="card">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px">Income sources</div>
    <p v-if="!sources.length" style="font-size: 13px; color: var(--color-text-muted); padding: 8px 0">
      No income sources yet.
    </p>
    <div v-for="src in sources" :key="src.id" class="src-row">
      <div style="flex: 1">
        <div style="font-size: 14px; font-weight: 500">{{ src.name }}</div>
        <div class="src-meta">
          {{ fmtCurrency(src.amount) }} {{ INCOME_FREQUENCY_LABELS[src.frequency] || '' }} ·
          <span style="color: var(--color-success)">{{ fmtCurrency(toMonthly(src.amount, src.frequency)) }}/mo</span>
        </div>
      </div>
      <button class="del-btn" @click="organizerStore.deleteIncomeSource(src.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.total-card {
  margin-bottom: 14px;
  padding: 14px;
}
.total-value {
  font-size: 26px;
  font-weight: 600;
  color: var(--color-success);
  margin-top: 4px;
}
.add-btn {
  width: 100%;
  background: var(--color-success);
  color: #fff;
  padding: 10px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
}
.src-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
}
.src-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
</style>

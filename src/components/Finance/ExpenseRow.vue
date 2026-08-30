<script setup>
import { ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { fmtCurrency, todayStr } from '../../utils/format.js'
import { EXPENSE_RECURRENCE_LABELS } from '../../utils/constants.js'

const props = defineProps({
  expense: { type: Object, required: true },
  categories: { type: Array, required: true },
})
const organizerStore = useOrganizerStore()

const editing = ref(false)
const form = ref({})

function startEdit() {
  form.value = { ...props.expense, startDate: props.expense.startDate || todayStr() }
  editing.value = true
}
function save() {
  const amount = parseFloat(form.value.amount)
  if (!form.value.category || !amount) return
  organizerStore.saveExpense(props.expense.id, {
    category: form.value.category,
    amount,
    description: (form.value.description || '').trim(),
    withdrawDay: parseInt(form.value.withdrawDay) || null,
    recurring: form.value.recurring,
    startDate: form.value.startDate || todayStr(),
  })
  editing.value = false
}
</script>

<template>
  <div v-if="editing" class="edit-box">
    <div style="display: flex; gap: 8px; margin-bottom: 8px">
      <select v-model="form.category" style="flex: 1; width: auto">
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <input v-model="form.amount" type="number" min="0" step="0.01" style="width: 80px; flex-shrink: 0" />
    </div>
    <input v-model="form.description" type="text" placeholder="Description (optional)" style="margin-bottom: 8px" />
    <div style="display: flex; gap: 8px; margin-bottom: 8px">
      <div style="flex: 1">
        <div class="field-label">Withdraw day</div>
        <input v-model="form.withdrawDay" type="number" min="1" max="31" placeholder="1–31" />
      </div>
      <div style="flex: 1">
        <div class="field-label">Start / date</div>
        <input v-model="form.startDate" type="date" />
      </div>
    </div>
    <select v-model="form.recurring" style="margin-bottom: 10px">
      <option value="one-time">One-time</option>
      <option value="monthly">Monthly</option>
      <option value="quarterly">Every 3 months</option>
      <option value="biannual">Every 6 months</option>
      <option value="yearly">Yearly</option>
    </select>
    <div style="display: flex; gap: 6px">
      <button class="sbtn" style="flex: 1" @click="save">Save</button>
      <button class="icon-btn" @click="editing = false">✕</button>
    </div>
  </div>

  <div v-else class="row">
    <div style="flex: 1">
      <div style="font-size: 13px; font-weight: 500">{{ expense.description || expense.category }}</div>
      <div class="meta">
        <span style="color: var(--color-primary)">{{ expense.category }}</span> ·
        {{ EXPENSE_RECURRENCE_LABELS[expense.recurring] || expense.recurring
        }}<template v-if="expense.withdrawDay"> · day {{ expense.withdrawDay }}</template>
      </div>
    </div>
    <span class="amount">{{ fmtCurrency(expense.amount) }}</span>
    <button class="icon-btn" @click="startEdit">✎</button>
    <button class="del-btn" @click="organizerStore.deleteExpense(expense.id)">✕</button>
  </div>
</template>

<style scoped>
.edit-box {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 10px;
  margin-bottom: 8px;
}
.field-label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
.row {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
}
.meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-danger);
  flex-shrink: 0;
}
</style>

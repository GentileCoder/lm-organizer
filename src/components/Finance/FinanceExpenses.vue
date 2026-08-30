<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { fmtCurrency, todayStr } from '../../utils/format.js'
import ExpenseRow from './ExpenseRow.vue'

const organizerStore = useOrganizerStore()
const categories = computed(() => organizerStore.data.finance.expenseCategories)
const expenses = computed(() => organizerStore.data.finance.expenses)

const monthlyFixed = computed(() =>
  expenses.value
    .filter(e => e.recurring !== 'one-time')
    .reduce((s, e) => s + e.amount / ({ monthly: 1, quarterly: 3, biannual: 6, yearly: 12 }[e.recurring] || 1), 0)
)

const newCategoryName = ref('')
function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return
  organizerStore.addExpenseCategory(name)
  newCategoryName.value = ''
}

const form = ref({
  category: categories.value[0] || '',
  amount: '',
  description: '',
  withdrawDay: '',
  startDate: todayStr(),
  recurring: 'one-time',
})
function addExpense() {
  const amount = parseFloat(form.value.amount)
  if (!form.value.category || !amount) return
  organizerStore.addExpense({
    category: form.value.category,
    amount,
    description: form.value.description.trim(),
    withdrawDay: parseInt(form.value.withdrawDay) || null,
    recurring: form.value.recurring,
    startDate: form.value.startDate || todayStr(),
  })
  form.value = {
    category: categories.value[0] || '',
    amount: '',
    description: '',
    withdrawDay: '',
    startDate: todayStr(),
    recurring: 'one-time',
  }
}
</script>

<template>
  <div class="sg2">
    <div class="sc">
      <div class="sl">Avg fixed / mo</div>
      <div class="sv" style="color: var(--color-danger)">{{ fmtCurrency(monthlyFixed) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Total entries</div>
      <div class="sv">{{ expenses.length }}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 10px">Categories</div>
    <div class="cat-tags">
      <span v-for="c in categories" :key="c" class="cat-tag">
        {{ c }}<span class="cat-tag-remove" @click="organizerStore.deleteExpenseCategory(c)">✕</span>
      </span>
      <span v-if="!categories.length" class="no-cats">No categories</span>
    </div>
    <div style="display: flex; gap: 8px">
      <input v-model="newCategoryName" type="text" placeholder="New category…" @keydown.enter="addCategory" />
      <button class="sbtn" @click="addCategory">Add</button>
    </div>
  </div>

  <div class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 12px">Add expense</div>
    <div style="display: flex; gap: 8px; margin-bottom: 8px">
      <select v-model="form.category" style="flex: 1; width: auto">
        <option v-if="!categories.length" value="">—</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <input
        v-model="form.amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="€"
        style="width: 80px; flex-shrink: 0"
      />
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
    <button class="pbtn" style="width: 100%" @click="addExpense">Add expense</button>
  </div>

  <div class="card">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px">All expenses</div>
    <p v-if="!expenses.length" style="font-size: 13px; color: var(--color-text-muted); padding: 8px 0">
      No expenses defined yet.
    </p>
    <ExpenseRow v-for="e in expenses" :key="e.id" :expense="e" :categories="categories" />
  </div>
</template>

<style scoped>
.cat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.cat-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 4px 10px;
  font-size: 12px;
  color: #aaa;
}
.cat-tag-remove {
  color: var(--color-text-faint);
  cursor: pointer;
  font-size: 11px;
}
.no-cats {
  font-size: 12px;
  color: var(--color-text-faint);
}
.field-label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
</style>

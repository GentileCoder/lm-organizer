<script setup>
import { ref } from 'vue'
import FinanceOverview from '../components/Finance/FinanceOverview.vue'
import FinanceMonth from '../components/Finance/FinanceMonth.vue'
import FinanceIncome from '../components/Finance/FinanceIncome.vue'
import FinanceExpenses from '../components/Finance/FinanceExpenses.vue'
import FinanceMinijob from '../components/Finance/FinanceMinijob.vue'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'month', label: 'Month' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'minijob', label: 'Minijob' },
]
const activeTab = ref('overview')
</script>

<template>
  <div class="fin-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="fin-tab"
      :class="{ active: activeTab === tab.key }"
      @click="activeTab = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>

  <FinanceOverview v-if="activeTab === 'overview'" />
  <FinanceMonth v-else-if="activeTab === 'month'" />
  <FinanceIncome v-else-if="activeTab === 'income'" />
  <FinanceExpenses v-else-if="activeTab === 'expenses'" />
  <FinanceMinijob v-else />
</template>

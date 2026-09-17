<script setup>
import { ref } from 'vue'
import LumpSumAnalyzer from '../components/Investment/LumpSumAnalyzer.vue'
import SparplanCalculator from '../components/Investment/SparplanCalculator.vue'

const tabs = [
  { key: 'lump-sum', label: 'Lump Sum' },
  { key: 'sparplan', label: 'Sparplan' },
]
const activeTab = ref('lump-sum')
</script>

<template>
  <div class="pill-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="pill-tab"
      :class="{ active: activeTab === tab.key }"
      @click="activeTab = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>

  <LumpSumAnalyzer v-if="activeTab === 'lump-sum'" />
  <SparplanCalculator v-else />
</template>

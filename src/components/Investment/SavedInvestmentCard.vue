<script setup>
import { computed } from 'vue'
import { fmtCurrency } from '../../utils/format.js'
import { useOrganizerStore } from '../../stores/organizer.js'

const props = defineProps({ inv: { type: Object, required: true } })
const organizerStore = useOrganizerStore()

const stars = computed(() => (props.inv.score > 0 ? '⭐'.repeat(props.inv.score) : '💸'))
const paybackStr = computed(() => {
  const m = props.inv.paybackMonths
  if (m === Infinity) return 'Never'
  return m <= 24 ? `${m}mo` : `${(m / 12).toFixed(1)}yr`
})
</script>

<template>
  <div class="card">
    <div class="row">
      <div class="info">
        <div class="name">{{ inv.name }}</div>
        <div class="meta">{{ inv.date }} · {{ fmtCurrency(inv.initial) }} invested</div>
      </div>
      <div class="score">
        <div class="stars">{{ stars }}</div>
        <div class="roi" :style="{ color: inv.scoreColor }">{{ inv.annualROI.toFixed(1) }}%</div>
      </div>
      <button class="del-btn" @click="organizerStore.deleteInvestment(inv.id)">✕</button>
    </div>
    <div class="footer">
      <span
        >Cash flow
        <span class="cash-flow" :style="{ color: inv.monthlyProfit >= 0 ? '#3d9e75' : '#E05C5C' }"
          >{{ fmtCurrency(inv.monthlyProfit) }}/mo</span
        ></span
      >
      <span
        >Payback <span class="value">{{ paybackStr }}</span></span
      >
      <span
        >3yr <span class="value">{{ fmtCurrency(inv.years[2].cumulative) }}</span></span
      >
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.score {
  text-align: right;
  flex-shrink: 0;
}
.stars {
  font-size: 12px;
}
.roi {
  font-size: 14px;
  font-weight: 700;
}
.footer {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-surface);
  font-size: 12px;
  color: var(--color-text-muted);
}
.value {
  color: var(--color-text);
  font-weight: 600;
}
.cash-flow {
  font-weight: 600;
}
</style>

<script setup>
import { computed } from 'vue'
import { fmtCurrency } from '../../utils/format.js'

const props = defineProps({ result: { type: Object, required: true } })
const emit = defineEmits(['save'])

const noBreakEven = computed(() => props.result.paybackMonths === Infinity)
const paybackStr = computed(() => {
  const r = props.result
  if (noBreakEven.value) return 'Never'
  return r.paybackMonths <= 24 ? `${r.paybackMonths} months` : `${(r.paybackMonths / 12).toFixed(1)} years`
})
const breakEvenYearIndex = computed(() =>
  props.result.years.findIndex(y => y.cumulative >= props.result.initial && props.result.initial > 0)
)
const starsStr = computed(() => (props.result.score > 0 ? '⭐'.repeat(props.result.score) : '💸'))

function yearBarColor(y) {
  const r = props.result
  const reached = r.initial > 0 && y.cumulative >= r.initial
  return reached ? '#3d9e75' : y.cumulative > 0 ? '#C9A227' : '#E05C5C'
}
function yearPct(y) {
  const r = props.result
  return r.initial > 0 ? Math.min(100, Math.max(0, (y.cumulative / r.initial) * 100)) : y.cumulative > 0 ? 100 : 0
}
</script>

<template>
  <div class="card score-card">
    <div class="stars">{{ starsStr }}</div>
    <div class="score-label" :style="{ color: result.scoreColor }">{{ result.scoreLabel }}</div>
    <div class="score-metrics">
      <div>
        <div class="score-metric-label">Annual ROI</div>
        <div class="score-metric-value" :style="{ color: result.scoreColor }">{{ result.annualROI.toFixed(1) }}%</div>
      </div>
      <div class="divider"></div>
      <div>
        <div class="score-metric-label">Payback</div>
        <div class="score-metric-value" :style="{ color: noBreakEven ? '#E05C5C' : result.scoreColor }">
          {{ paybackStr }}
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="inv-label" style="margin-bottom: 10px">Key Metrics</div>
    <div class="metric-row">
      <span class="metric-label">Monthly cash flow</span>
      <span class="metric-value" :style="{ color: result.monthlyProfit >= 0 ? '#3d9e75' : '#E05C5C' }">{{
        fmtCurrency(result.monthlyProfit)
      }}</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">Annual net profit</span>
      <span class="metric-value" :style="{ color: result.annualProfit >= 0 ? '#3d9e75' : '#E05C5C' }">{{
        fmtCurrency(result.annualProfit)
      }}</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">Break-even point</span>
      <span
        class="metric-value"
        :style="{
          color: noBreakEven
            ? '#E05C5C'
            : result.paybackMonths < 24
              ? '#3d9e75'
              : result.paybackMonths < 60
                ? '#C9A227'
                : '#E08A3C',
        }"
        >{{ paybackStr }}</span
      >
    </div>
    <div class="metric-row">
      <span class="metric-label">Initial investment</span>
      <span class="metric-value" style="color: var(--color-text)">{{ fmtCurrency(result.initial) }}</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">Monthly revenue</span>
      <span class="metric-value" style="color: var(--color-text-muted)">{{ fmtCurrency(result.monthlyRev) }}</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">Monthly costs</span>
      <span class="metric-value" style="color: var(--color-text-muted)">{{ fmtCurrency(result.monthlyCost) }}</span>
    </div>
  </div>

  <div class="card">
    <div class="inv-label" style="margin-bottom: 12px">
      3-Year Projection<template v-if="result.growth !== 0">
        ({{ result.growth > 0 ? '+' : '' }}{{ result.growth }}% growth/yr)</template
      >
    </div>

    <div v-for="y in result.years" :key="y.year" class="year-block">
      <div class="year-header">
        <span class="year-label">Year {{ y.year }}</span>
        <span class="year-profit">+{{ fmtCurrency(y.profit) }} this year</span>
        <span class="year-cumulative" :style="{ color: yearBarColor(y) }">{{ fmtCurrency(y.cumulative) }}</span>
      </div>
      <div class="year-track">
        <div class="year-fill" :style="{ width: yearPct(y) + '%', background: yearBarColor(y) }"></div>
      </div>
      <div v-if="breakEvenYearIndex === y.year - 1" class="break-even-note">
        ✓ Break-even reached in Year {{ y.year }}
      </div>
      <div
        v-else-if="!(result.initial > 0 && y.cumulative >= result.initial) && result.initial > 0"
        class="remaining-note"
      >
        {{ fmtCurrency(Math.max(0, result.initial - y.cumulative)) }} still to recover
      </div>
    </div>

    <div class="totals-block">
      <div class="totals-label">Cumulative profit after 3 years</div>
      <div class="totals-value" :style="{ color: result.years[2].cumulative >= 0 ? '#3d9e75' : '#E05C5C' }">
        {{ fmtCurrency(result.years[2].cumulative) }}
      </div>
      <div v-if="result.initial > 0" class="roi-note">
        Total ROI over 3 years:
        <span class="roi-value">{{ ((result.years[2].cumulative / result.initial) * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <button class="sbtn" style="width: 100%; margin-top: 14px" @click="emit('save')">Save Analysis</button>
  </div>
</template>

<style scoped>
.score-card {
  text-align: center;
  padding: 24px 16px;
}
.stars {
  font-size: 40px;
  margin-bottom: 6px;
}
.score-label {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
}
.score-metrics {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 8px;
}
.score-metric-label {
  font-size: 11px;
  color: var(--color-text-muted);
}
.score-metric-value {
  font-size: 18px;
  font-weight: 700;
}
.divider {
  width: 1px;
  background: var(--color-border);
}
.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid var(--color-surface);
}
.metric-label {
  font-size: 13px;
  color: var(--color-text-muted);
}
.metric-value {
  font-size: 14px;
  font-weight: 600;
}
.year-block {
  margin-bottom: 14px;
}
.year-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}
.year-label {
  font-size: 13px;
  font-weight: 600;
}
.year-profit {
  font-size: 12px;
  color: var(--color-text-muted);
}
.year-cumulative {
  font-size: 14px;
  font-weight: 700;
}
.year-track {
  background: var(--color-surface);
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
}
.year-fill {
  height: 8px;
  border-radius: 4px;
}
.break-even-note {
  font-size: 11px;
  color: var(--color-success);
  margin-top: 4px;
}
.remaining-note {
  font-size: 10px;
  color: var(--color-text-faint);
  margin-top: 3px;
}
.totals-block {
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
  margin-top: 4px;
}
.totals-label {
  font-size: 12px;
  color: var(--color-text-muted);
}
.totals-value {
  font-size: 20px;
  font-weight: 700;
}
.roi-note {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.roi-value {
  color: var(--color-text);
  font-weight: 600;
}
</style>

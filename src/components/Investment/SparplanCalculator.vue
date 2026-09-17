<script setup>
import { reactive, computed } from 'vue'
import { computeSparplanSeries } from '../../utils/sparplanCalc.js'
import { fmtCurrency } from '../../utils/format.js'
import SparplanChart from './SparplanChart.vue'

const form = reactive({ monthly: '100', rate: '5', years: '37' })

const monthly = computed(() => Math.max(0, parseFloat(form.monthly) || 0))
const rate = computed(() => parseFloat(form.rate) || 0)
const years = computed(() => Math.max(1, Math.min(60, parseInt(form.years) || 1)))

const points = computed(() =>
  computeSparplanSeries({ monthly: monthly.value, annualRate: rate.value, years: years.value })
)
const lastPoint = computed(() => points.value[points.value.length - 1])
const interestEarned = computed(() => lastPoint.value.endCapital - lastPoint.value.contributed)
</script>

<template>
  <div class="card" style="margin-bottom: 12px">
    <div style="font-size: 15px; font-weight: 700; margin-bottom: 14px">Sparplan Calculator</div>
    <div class="sg3">
      <div>
        <div class="inv-label">Monthly Contribution (€)</div>
        <input v-model="form.monthly" type="number" min="0" step="10" placeholder="100" />
      </div>
      <div>
        <div class="inv-label">Annual Return (%)</div>
        <input v-model="form.rate" type="number" min="-20" max="30" step="0.1" placeholder="5" />
      </div>
      <div>
        <div class="inv-label">Duration (years)</div>
        <input v-model="form.years" type="number" min="1" max="60" step="1" placeholder="37" />
      </div>
    </div>
  </div>

  <div class="sg3">
    <div class="sc">
      <div class="sl">Final Capital</div>
      <div class="sv" style="color: var(--color-primary)">{{ fmtCurrency(lastPoint.endCapital) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Contributed</div>
      <div class="sv">{{ fmtCurrency(lastPoint.contributed) }}</div>
    </div>
    <div class="sc">
      <div class="sl">Interest Earned</div>
      <div class="sv" style="color: var(--color-success)">
        {{ interestEarned >= 0 ? '+' : '' }}{{ fmtCurrency(interestEarned) }}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="chart-title">Capital growth over time</div>
    <div class="chart-sub">{{ fmtCurrency(monthly) }}/month · {{ rate }}% p.a. · {{ years }} years</div>
    <div class="legend">
      <span class="legend-item"><span class="legend-swatch solid"></span>Final capital</span>
      <span class="legend-item"><span class="legend-swatch dashed"></span>Contributed (no interest)</span>
    </div>
    <SparplanChart :points="points" />
  </div>

  <p class="footnote">
    Nominal values, monthly compounding (annual rate ÷ 12), contribution at month-end. Does not account for inflation,
    taxes, or fees. The assumed return is an assumption, not a guarantee — not investment advice.
  </p>
</template>

<style scoped>
.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}
.chart-sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 14px;
}
.legend {
  display: flex;
  gap: 18px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend-swatch {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  display: inline-block;
}
.legend-swatch.solid {
  background: var(--color-primary);
}
.legend-swatch.dashed {
  background: repeating-linear-gradient(90deg, var(--color-text-muted) 0 5px, transparent 5px 9px);
  height: 2px;
}
.footnote {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 16px;
  line-height: 1.5;
}
</style>

<script setup>
import { reactive, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { calcInvestment } from '../../utils/investmentCalc.js'
import { SCORE_TIERS, tierClass } from '../../utils/investmentTiers.js'
import InvestmentResultCard from './InvestmentResultCard.vue'
import SavedInvestmentCard from './SavedInvestmentCard.vue'

const organizerStore = useOrganizerStore()

const form = reactive({ name: '', initial: '', monthlyRev: '', monthlyCost: '', growth: '' })
const result = ref(null)

function calculate() {
  result.value = calcInvestment({
    name: form.name.trim() || 'My Investment',
    initial: parseFloat(form.initial) || 0,
    monthlyRev: parseFloat(form.monthlyRev) || 0,
    monthlyCost: parseFloat(form.monthlyCost) || 0,
    growth: parseFloat(form.growth) || 0,
  })
}

function saveAnalysis() {
  if (!result.value) return
  organizerStore.saveInvestmentAnalysis(result.value)
  result.value = null
  form.name = ''
  form.initial = ''
  form.monthlyRev = ''
  form.monthlyCost = ''
  form.growth = ''
}
</script>

<template>
  <div class="card" style="margin-bottom: 12px">
    <div style="font-size: 15px; font-weight: 700; margin-bottom: 14px">📈 Investment Analyzer</div>

    <div class="inv-label">Investment Name</div>
    <input v-model="form.name" type="text" placeholder="e.g. Apartment, Business, Fund" style="margin-bottom: 10px" />

    <div class="inv-label">Initial Investment (€)</div>
    <input v-model="form.initial" type="number" min="0" step="1" placeholder="50000" style="margin-bottom: 10px" />

    <div class="sg2" style="margin-bottom: 10px">
      <div>
        <div class="inv-label">Monthly Revenue (€)</div>
        <input v-model="form.monthlyRev" type="number" min="0" step="1" placeholder="8000" />
      </div>
      <div>
        <div class="inv-label">Monthly Costs (€)</div>
        <input v-model="form.monthlyCost" type="number" min="0" step="1" placeholder="5000" />
      </div>
    </div>

    <div class="inv-label">Expected Annual Growth Rate (%)</div>
    <input
      v-model="form.growth"
      type="number"
      min="-100"
      max="1000"
      step="0.5"
      placeholder="10"
      style="margin-bottom: 14px"
    />

    <button class="pbtn" style="width: 100%" @click="calculate">Calculate</button>
  </div>

  <div class="card explainer-card">
    <div class="explainer-title">WHAT MAKES A GOOD INVESTMENT?</div>
    <div class="explainer-body">
      <b>ROI (Return on Investment)</b> — annual net profit ÷ initial capital × 100.<br />
      <b>Payback period</b> — months until cumulative profit covers your investment.<br />
      <b>Cash flow</b> — monthly revenue minus monthly costs. Must be positive.<br />
      <b>Growth rate</b> — expected annual increase in profits (use conservative estimates).
    </div>
    <div class="scale-grid">
      <div v-for="t in SCORE_TIERS" :key="t.tier" class="scale-row">
        <span>{{ t.stars }} {{ t.label }}</span>
        <span class="scale-range" :class="tierClass(t.tier)">{{ t.range }}</span>
      </div>
    </div>
  </div>

  <InvestmentResultCard v-if="result" :result="result" @save="saveAnalysis" />

  <template v-if="organizerStore.data.investments.length">
    <div class="section-label" style="margin: 16px 0 8px">Saved Analyses</div>
    <SavedInvestmentCard v-for="inv in organizerStore.data.investments" :key="inv.id" :inv="inv" />
  </template>
</template>

<style scoped>
.explainer-card {
  margin-bottom: 12px;
  padding: 12px 14px;
}
.explainer-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 8px;
  letter-spacing: 0.04em;
}
.explainer-body {
  font-size: 12px;
  color: #aaa;
  line-height: 1.7;
}
.explainer-body b {
  color: var(--color-text);
}
.scale-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  font-size: 11px;
}
.scale-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 0;
}
.scale-range {
  margin-left: auto;
}
</style>

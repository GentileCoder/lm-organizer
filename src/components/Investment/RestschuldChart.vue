<script setup>
import { computed, ref } from 'vue'
import { fmtCurrency } from '../../utils/format.js'

const props = defineProps({
  points: { type: Array, required: true },
  markYear: { type: Number, default: null },
})

const WIDTH = 680
const HEIGHT = 240
const MARGIN = { top: 16, right: 16, bottom: 32, left: 64 }
const innerW = WIDTH - MARGIN.left - MARGIN.right
const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

const maxYear = computed(() => props.points[props.points.length - 1]?.year || 1)
const maxVal = computed(() => Math.max(1, ...props.points.map(p => p.balance)))

function x(year) {
  return MARGIN.left + (year / maxYear.value) * innerW
}
function y(val) {
  return MARGIN.top + innerH - (val / maxVal.value) * innerH
}

const gridLines = computed(() => {
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, s) => {
    const val = (maxVal.value / steps) * s
    return { yy: y(val), label: Math.round(val / 1000) + 'k' }
  })
})
const xTicks = computed(() => {
  const count = Math.min(6, maxYear.value)
  return Array.from({ length: count + 1 }, (_, t) => {
    const yr = Math.round((maxYear.value / count) * t)
    return { xx: x(yr), label: `J${yr}` }
  })
})

const line = computed(() => props.points.map(p => `${x(p.year)},${y(p.balance)}`).join(' '))
const areaPath = computed(() => {
  const pts = props.points
  return (
    `M${x(0)},${y(0)} ` + pts.map(p => `L${x(p.year)},${y(p.balance)}`).join(' ') + ` L${x(maxYear.value)},${y(0)} Z`
  )
})
const markX = computed(() => (props.markYear != null ? x(props.markYear) : null))

const hoveredIndex = ref(null)
const hoveredPoint = computed(() => (hoveredIndex.value === null ? null : props.points[hoveredIndex.value]))
const tooltipStyle = ref({})
const chartRoot = ref(null)
const svgEl = ref(null)

function showTooltip(idx) {
  hoveredIndex.value = idx
  const p = props.points[idx]
  if (!chartRoot.value || !svgEl.value) return
  const containerRect = chartRoot.value.getBoundingClientRect()
  const svgRect = svgEl.value.getBoundingClientRect()
  const scale = svgRect.width / WIDTH
  const px = svgRect.left - containerRect.left + x(p.year) * scale
  const py = svgRect.top - containerRect.top + y(p.balance) * scale
  const tooltipWidth = 150
  let left = px + 14
  if (left + tooltipWidth > containerRect.width) left = px - tooltipWidth - 14
  tooltipStyle.value = { left: `${left}px`, top: `${Math.max(0, py - 44)}px`, opacity: 1 }
}
function hideTooltip() {
  hoveredIndex.value = null
  tooltipStyle.value = { opacity: 0 }
}
</script>

<template>
  <div ref="chartRoot" class="chart-root">
    <svg ref="svgEl" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="xMidYMid meet">
      <line
        v-for="(g, i) in gridLines"
        :key="'grid' + i"
        class="gridline"
        :x1="MARGIN.left"
        :y1="g.yy"
        :x2="MARGIN.left + innerW"
        :y2="g.yy"
      />
      <line
        class="baseline"
        :x1="MARGIN.left"
        :y1="MARGIN.top + innerH"
        :x2="MARGIN.left + innerW"
        :y2="MARGIN.top + innerH"
      />
      <text
        v-for="(g, i) in gridLines"
        :key="'gl' + i"
        class="axis-label"
        :x="MARGIN.left - 10"
        :y="g.yy + 4"
        text-anchor="end"
      >
        {{ g.label }}
      </text>
      <text
        v-for="(t, i) in xTicks"
        :key="'xt' + i"
        class="axis-label"
        :x="t.xx"
        :y="MARGIN.top + innerH + 20"
        text-anchor="middle"
      >
        {{ t.label }}
      </text>

      <path class="area-balance" :d="areaPath" />
      <polyline class="line-balance" :points="line" />

      <line
        v-if="markX !== null"
        class="mark-line"
        :x1="markX"
        :y1="MARGIN.top"
        :x2="markX"
        :y2="MARGIN.top + innerH"
      />

      <line
        v-if="hoveredPoint"
        class="hover-line"
        :x1="x(hoveredPoint.year)"
        :y1="MARGIN.top"
        :x2="x(hoveredPoint.year)"
        :y2="MARGIN.top + innerH"
      />

      <circle
        v-for="(p, idx) in points"
        :key="p.year"
        class="hover-target"
        :cx="x(p.year)"
        :cy="y(p.balance)"
        r="10"
        fill="transparent"
        @mouseenter="showTooltip(idx)"
        @mousemove="showTooltip(idx)"
        @mouseleave="hideTooltip"
      />
    </svg>

    <div class="tooltip" :style="tooltipStyle">
      <template v-if="hoveredPoint">
        <div class="t-year">Year {{ hoveredPoint.year }}</div>
        <div class="t-row">
          <strong>{{ fmtCurrency(hoveredPoint.balance) }}</strong> outstanding
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chart-root {
  position: relative;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.axis-label {
  fill: var(--color-text-muted);
  font-size: 11px;
}
.gridline,
.baseline {
  stroke: var(--color-border);
  stroke-width: 1;
}
.line-balance {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.area-balance {
  fill: var(--color-primary);
  opacity: 0.12;
}
.mark-line {
  stroke: var(--color-text-muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.hover-line {
  stroke: var(--color-border);
  stroke-width: 1;
}
.hover-target {
  cursor: pointer;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  font-size: 12px;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.12));
  opacity: 0;
  transition: opacity 0.1s;
  white-space: nowrap;
  color: var(--color-text);
}
.t-year {
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
</style>

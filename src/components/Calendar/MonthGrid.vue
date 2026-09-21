<script setup>
import { computed } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { eventsForDate, evtColor } from '../../utils/recurrence.js'
import { todayStr } from '../../utils/format.js'
import { DAYS } from '../../utils/constants.js'

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  selectedDate: { type: String, default: null },
})
const emit = defineEmits(['select-day'])

const organizerStore = useOrganizerStore()
const today = todayStr()

const leadingBlanks = computed(() => new Date(props.year, props.month, 1).getDay())
const daysInMonth = computed(() => new Date(props.year, props.month + 1, 0).getDate())

const cells = computed(() => {
  const result = []
  for (let d = 1; d <= daysInMonth.value; d++) {
    const ds = `${props.year}-${String(props.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const events = eventsForDate(organizerStore.data.events, ds)
    result.push({
      d,
      ds,
      events: events.slice(0, 2),
      more: events.length > 2 ? events.length - 2 : 0,
      count: events.length,
      isToday: ds === today,
      isSelected: ds === props.selectedDate,
    })
  }
  return result
})

// Heat tint: a density-based wash behind each day, stronger the more events it has —
// skipped for the selected day so its solid primary fill stays legible. A ring plus a
// count badge ride alongside it since a subtle tint alone reads ambiguous against a
// mostly empty month.
const HEAT_STOPS = { 1: 32, 2: 55 }
function heatStyle(cell) {
  if (cell.isSelected || !cell.count) return {}
  const pct = HEAT_STOPS[cell.count] ?? 78
  return {
    background: `color-mix(in srgb, var(--color-primary) ${pct}%, var(--color-bg))`,
    borderColor: 'var(--color-primary)',
    borderWidth: '2px',
  }
}
</script>

<template>
  <div class="cal-grid">
    <div v-for="d in DAYS" :key="d" class="day-heading">{{ d }}</div>
  </div>
  <div class="cal-grid">
    <div v-for="i in leadingBlanks" :key="'blank' + i"></div>
    <div
      v-for="cell in cells"
      :key="cell.ds"
      class="cal-day"
      :class="{ today: cell.isToday, selected: cell.isSelected }"
      :style="heatStyle(cell)"
      @click="emit('select-day', cell.ds)"
    >
      <span>{{ cell.d }}</span>
      <span v-if="cell.count && !cell.isSelected" class="cal-day-badge">{{ cell.count }}</span>
      <div
        v-for="e in cell.events"
        :key="e.id"
        class="cal-evt-chip"
        :style="{
          background: cell.isSelected
            ? 'rgba(255,255,255,0.25)'
            : evtColor(organizerStore.data.eventCategories, e.category),
        }"
      >
        {{ e.recurring && e.recurring !== 'none' ? '🔁 ' : '' }}{{ e.title }}
      </div>
      <div v-if="cell.more" class="cal-evt-more">+{{ cell.more }}</div>
    </div>
  </div>
</template>

<style scoped>
.day-heading {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 4px 0;
}
.cal-day-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 19px;
  height: 19px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-primary-text, #fff);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}
</style>

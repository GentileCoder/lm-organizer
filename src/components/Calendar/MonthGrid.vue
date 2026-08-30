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
      isToday: ds === today,
      isSelected: ds === props.selectedDate,
    })
  }
  return result
})
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
      @click="emit('select-day', cell.ds)"
    >
      <span>{{ cell.d }}</span>
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
</style>

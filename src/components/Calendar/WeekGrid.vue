<script setup>
import { computed } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { eventsForDate, evtColor } from '../../utils/recurrence.js'
import { dateStr, fmtTime, todayStr } from '../../utils/format.js'
import { DAYS } from '../../utils/constants.js'

const props = defineProps({
  weekStart: { type: Date, required: true },
})
const emit = defineEmits(['select-day'])

const organizerStore = useOrganizerStore()
const today = todayStr()

const days = computed(() => {
  const result = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(props.weekStart)
    d.setDate(d.getDate() + i)
    const ds = dateStr(d)
    result.push({ ds, day: d, isToday: ds === today, events: eventsForDate(organizerStore.data.events, ds) })
  }
  return result
})
</script>

<template>
  <div class="week-grid">
    <div v-for="col in days" :key="col.ds" class="day-col">
      <div class="day-header" @click="emit('select-day', col.ds)">
        <div class="day-name">{{ DAYS[col.day.getDay()].slice(0, 2) }}</div>
        <div class="day-num" :class="{ today: col.isToday }">{{ col.day.getDate() }}</div>
      </div>
      <div
        v-for="e in col.events"
        :key="e.id"
        class="evt-chip"
        :style="{ borderColor: evtColor(organizerStore.data.eventCategories, e.category) }"
        @click="emit('select-day', col.ds)"
      >
        <div
          v-if="e.time"
          class="evt-time"
          :style="{ color: evtColor(organizerStore.data.eventCategories, e.category) }"
        >
          {{ fmtTime(e.time) }}
        </div>
        <div class="evt-title">{{ e.recurring && e.recurring !== 'none' ? '🔁 ' : '' }}{{ e.title }}</div>
      </div>
      <div class="add-target" @click="emit('select-day', col.ds)">+</div>
    </div>
  </div>
</template>

<style scoped>
.week-grid {
  display: flex;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 160px;
}
.day-col {
  flex: 1;
  min-width: 0;
  border-right: 1px solid var(--color-border);
  padding: 0 3px;
}
.day-col:last-child {
  border-right: none;
}
.day-header {
  text-align: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 5px;
  cursor: pointer;
}
.day-name {
  font-size: 10px;
  color: var(--color-text-muted);
}
.day-num {
  font-size: 13px;
  font-weight: 500;
}
.day-num.today {
  color: var(--color-primary);
}
.evt-chip {
  border-left: 2px solid;
  background: var(--color-border);
  border-radius: 0 5px 5px 0;
  padding: 3px 5px;
  margin-bottom: 3px;
  cursor: pointer;
}
.evt-time {
  font-size: 9px;
}
.evt-title {
  font-size: 10px;
  color: var(--color-text);
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.add-target {
  text-align: center;
  margin-top: 4px;
  cursor: pointer;
  color: var(--color-border);
  font-size: 16px;
}
</style>

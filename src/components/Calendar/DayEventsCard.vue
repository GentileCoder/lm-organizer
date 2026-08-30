<script setup>
import { computed, ref, watch } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { eventsForDate } from '../../utils/recurrence.js'
import EventForm from './EventForm.vue'
import EventRow from './EventRow.vue'

const props = defineProps({
  dateStr: { type: String, required: true },
  title: { type: String, required: true },
})

const organizerStore = useOrganizerStore()
const showAddForm = ref(false)
const events = computed(() => eventsForDate(organizerStore.data.events, props.dateStr))

// Switching to a different date closes any open add-form from the previous one.
watch(
  () => props.dateStr,
  () => (showAddForm.value = false)
)
</script>

<template>
  <div class="header">
    <span class="title">{{ title }}</span>
    <button class="sbtn" style="font-size: 12px; padding: 4px 10px" @click="showAddForm = !showAddForm">
      {{ showAddForm ? '✕ Cancel' : '＋ Add' }}
    </button>
  </div>

  <EventForm v-if="showAddForm" :date-str="dateStr" @done="showAddForm = false" />

  <div :style="{ marginTop: showAddForm ? '10px' : '0' }">
    <p v-if="!events.length" class="no-events">No events</p>
    <EventRow v-for="e in events" :key="e.id" :event="e" :date-str="dateStr" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}
.no-events {
  font-size: 13px;
  color: var(--color-text-faint);
  padding: 8px 0 0;
}
</style>

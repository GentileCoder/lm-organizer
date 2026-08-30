<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { evtColor, recurLabel } from '../../utils/recurrence.js'
import { fmtTime } from '../../utils/format.js'
import { RECURRENCE_OPTIONS } from '../../utils/constants.js'

const props = defineProps({
  event: { type: Object, required: true },
  dateStr: { type: String, required: true },
})
const organizerStore = useOrganizerStore()

const editing = ref(false)
const confirmingDelete = ref(false)
const form = ref({})

const color = computed(() => evtColor(organizerStore.data.eventCategories, props.event.category))
const timeLabel = computed(() => fmtTime(props.event.time))
const isRecurring = computed(() => props.event.recurring && props.event.recurring !== 'none')
const recurringLabel = computed(() => (isRecurring.value ? recurLabel(props.event.recurring) : ''))

function startEdit() {
  form.value = {
    title: props.event.title,
    time: props.event.time || '',
    category: props.event.category,
    recurring: props.event.recurring || 'none',
  }
  editing.value = true
  confirmingDelete.value = false
}
function saveEdit() {
  const title = form.value.title.trim()
  if (!title) return
  organizerStore.saveEvent(props.event.id, {
    title,
    time: form.value.time,
    category: form.value.category,
    recurring: form.value.recurring,
  })
  editing.value = false
}
function deleteOccurrence() {
  organizerStore.deleteEventOccurrence(props.event.id, props.dateStr)
  confirmingDelete.value = false
}
function deleteSeries() {
  organizerStore.deleteEventSeries(props.event.id)
  confirmingDelete.value = false
}
</script>

<template>
  <div v-if="confirmingDelete" class="confirm-row">
    <span class="confirm-text"
      >Delete <strong>{{ event.title }}</strong
      >?</span
    >
    <button v-if="isRecurring" class="sbtn confirm-btn occurrence" @click="deleteOccurrence">This date</button>
    <button v-if="isRecurring" class="sbtn confirm-btn series" @click="deleteSeries">All dates</button>
    <button v-else class="sbtn confirm-btn series" @click="deleteSeries">Delete</button>
    <button class="icon-btn" @click="confirmingDelete = false">✕</button>
  </div>

  <div v-else-if="editing" class="evt-edit-form">
    <input v-model="form.title" />
    <div class="row">
      <input v-model="form.time" type="time" style="width: 100px; flex-shrink: 0" />
      <select v-model="form.category">
        <option v-for="c in organizerStore.data.eventCategories" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>
    <select v-model="form.recurring">
      <option v-for="o in RECURRENCE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <div class="row">
      <button class="sbtn" style="font-size: 12px; padding: 4px 10px; flex: 1" @click="saveEdit">
        Save all occurrences
      </button>
      <button class="icon-btn" @click="editing = false">✕</button>
    </div>
  </div>

  <div v-else class="row event-row">
    <div class="bar" :style="{ background: color }"></div>
    <span v-if="timeLabel" class="time-chip" :style="{ color }">{{ timeLabel }}</span>
    <span v-else class="time-chip all-day">All day</span>
    <span class="title">{{ event.title }}</span>
    <div class="meta">
      <span class="category" :style="{ color }">{{ event.category || 'Other' }}</span>
      <span v-if="isRecurring" class="recurring">🔁 {{ recurringLabel }}</span>
    </div>
    <button class="icon-btn" title="Edit" @click="startEdit">✎</button>
    <button class="del-btn" @click="confirmingDelete = true">✕</button>
  </div>
</template>

<style scoped>
.confirm-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-surface);
  flex-wrap: wrap;
}
.confirm-text {
  font-size: 13px;
  flex: 1;
}
.confirm-btn {
  font-size: 11px;
  padding: 3px 8px;
}
.confirm-btn.occurrence {
  background: var(--color-border);
  color: var(--color-text);
}
.confirm-btn.series {
  background: var(--color-danger);
}
.row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.event-row {
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-surface);
  flex-wrap: nowrap;
}
.bar {
  width: 3px;
  min-height: 32px;
  align-self: stretch;
  border-radius: 2px;
  flex-shrink: 0;
}
.time-chip {
  font-size: 11px;
  background: var(--color-surface);
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
}
.time-chip.all-day {
  color: var(--color-text-faint);
  background: var(--color-surface-raised);
}
.title {
  flex: 1;
  font-size: 14px;
}
.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}
.category {
  font-size: 10px;
  opacity: 0.85;
}
.recurring {
  font-size: 9px;
  color: var(--color-text-muted);
}
</style>

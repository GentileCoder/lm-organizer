<script setup>
import { ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { RECURRENCE_OPTIONS } from '../../utils/constants.js'

const props = defineProps({ dateStr: { type: String, required: true } })
const emit = defineEmits(['done'])

const organizerStore = useOrganizerStore()
const title = ref('')
const time = ref('')
const category = ref((organizerStore.data.eventCategories[0] || {}).name || 'Other')
const recurring = ref('none')

function submit() {
  const t = title.value.trim()
  if (!t) return
  organizerStore.addEvent({
    date: props.dateStr,
    time: time.value,
    title: t,
    category: category.value,
    recurring: recurring.value,
  })
  title.value = ''
  time.value = ''
  recurring.value = 'none'
  emit('done')
}
</script>

<template>
  <div class="form">
    <input v-model="title" type="text" placeholder="Event title" @keydown.enter="submit" />
    <div class="row">
      <input v-model="time" type="time" style="width: 100px; flex-shrink: 0" />
      <select v-model="category">
        <option v-for="c in organizerStore.data.eventCategories" :key="c.name" :value="c.name">{{ c.name }}</option>
      </select>
    </div>
    <select v-model="recurring">
      <option v-for="o in RECURRENCE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <button class="sbtn" style="align-self: flex-end; padding: 5px 18px" @click="submit">Add</button>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
}
.row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>

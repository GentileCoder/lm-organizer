<script setup>
import { ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'

const props = defineProps({
  section: { type: String, required: true, validator: v => ['tasks', 'notes'].includes(v) },
  label: { type: String, required: true },
})

const organizerStore = useOrganizerStore()
const newText = ref('')

function add() {
  const text = newText.value.trim()
  if (!text) return
  organizerStore.addWorkspaceItem(props.section, text)
  newText.value = ''
}
</script>

<template>
  <div class="add-row">
    <input v-model="newText" type="text" :placeholder="`Add ${label}…`" @keydown.enter="add" />
    <button class="pbtn" @click="add">Add</button>
  </div>

  <p v-if="!organizerStore.data[section].length" class="empty">Nothing here yet.</p>

  <div v-for="item in organizerStore.data[section]" :key="item.id" class="card">
    <div class="row">
      <div
        class="check"
        :class="{ done: item.done }"
        @click="organizerStore.toggleWorkspaceItem(section, item.id)"
      ></div>
      <span class="text" :class="{ done: item.done }">{{ item.text }}</span>
      <button class="del-btn" @click="organizerStore.deleteWorkspaceItem(section, item.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  cursor: pointer;
  flex-shrink: 0;
}
.check.done {
  border-color: var(--color-success);
  background: var(--color-success);
}
.text {
  flex: 1;
  font-size: 14px;
}
.text.done {
  text-decoration: line-through;
  color: var(--color-text-muted);
}
</style>

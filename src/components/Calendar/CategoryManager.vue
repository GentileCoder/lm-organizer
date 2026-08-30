<script setup>
import { ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'

const organizerStore = useOrganizerStore()
const editingName = ref(null)
const editDraft = ref({ name: '', color: '' })
const newName = ref('')
const newColor = ref('#4A90D9')

function startEdit(cat) {
  editingName.value = cat.name
  editDraft.value = { name: cat.name, color: cat.color }
}
function saveEdit(originalName) {
  const name = editDraft.value.name.trim()
  if (!name) return
  organizerStore.saveEventCategory(originalName, { name, color: editDraft.value.color })
  editingName.value = null
}
function add() {
  const name = newName.value.trim()
  if (!name) return
  organizerStore.addEventCategory(name, newColor.value)
  newName.value = ''
  newColor.value = '#888888'
}
</script>

<template>
  <div class="card">
    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px">Event Categories</div>

    <div v-for="cat in organizerStore.data.eventCategories" :key="cat.name">
      <div v-if="editingName === cat.name" class="cat-row" style="flex-wrap: wrap; gap: 6px">
        <input v-model="editDraft.name" style="flex: 1; min-width: 100px" />
        <input v-model="editDraft.color" type="color" />
        <button class="sbtn" style="font-size: 12px; padding: 4px 10px" @click="saveEdit(cat.name)">Save</button>
        <button class="icon-btn" @click="editingName = null">✕</button>
      </div>
      <div v-else class="cat-row">
        <div class="cat-swatch" :style="{ background: cat.color }"></div>
        <span style="flex: 1; font-size: 14px">{{ cat.name }}</span>
        <button class="icon-btn" title="Edit" @click="startEdit(cat)">✎</button>
        <button class="icon-btn" title="Delete" @click="organizerStore.deleteEventCategory(cat.name)">✕</button>
      </div>
    </div>

    <div class="new-cat">
      <div class="section-label" style="margin-bottom: 8px">New category</div>
      <div style="display: flex; gap: 8px; align-items: center">
        <input v-model="newName" type="text" placeholder="Name" style="flex: 1" @keydown.enter="add" />
        <input v-model="newColor" type="color" />
        <button class="sbtn" @click="add">Add</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.new-cat {
  border-top: 1px solid var(--color-border);
  margin-top: 10px;
  padding-top: 10px;
}
</style>

<script setup>
import { ref } from 'vue'
import TaskNoteList from '../components/Workspace/TaskNoteList.vue'
import ReviewTab from '../components/Workspace/ReviewTab.vue'

const tabs = [
  { key: 'tasks', label: '✓ Tasks' },
  { key: 'notes', label: '≡ Notes' },
  { key: 'review', label: '★ Review' },
]
const activeTab = ref('tasks')
</script>

<template>
  <div class="pill-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="pill-tab"
      :class="{ active: activeTab === tab.key }"
      @click="activeTab = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>

  <TaskNoteList v-if="activeTab === 'tasks'" section="tasks" label="task" />
  <TaskNoteList v-else-if="activeTab === 'notes'" section="notes" label="note" />
  <ReviewTab v-else />
</template>

<script setup>
import { ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'

const organizerStore = useOrganizerStore()
const draft = ref('')
const copyFeedback = ref('')

function save() {
  const text = draft.value.trim()
  if (!text) return
  organizerStore.addReview(text)
  draft.value = ''
}

async function copyAll() {
  const txt = organizerStore.data.review.map((r, i) => `${i + 1}. [${r.date}] ${r.text}`).join('\n\n')
  try {
    await navigator.clipboard.writeText(txt)
    copyFeedback.value = 'Copied!'
  } catch {
    copyFeedback.value = 'Copy failed — try manually.'
  }
  setTimeout(() => (copyFeedback.value = ''), 2000)
}
</script>

<template>
  <div class="card" style="margin-bottom: 14px">
    <div style="font-size: 13px; font-weight: 500; margin-bottom: 10px">New idea or improvement</div>
    <textarea
      v-model="draft"
      placeholder="Describe an idea, bug, or feature…"
      style="min-height: 80px; margin-bottom: 8px"
    ></textarea>
    <button class="pbtn" style="width: 100%" @click="save">Save idea</button>
  </div>

  <button v-if="organizerStore.data.review.length" class="copy-btn" @click="copyAll">
    {{ copyFeedback || 'Copy all ideas to clipboard ↗' }}
  </button>

  <p v-if="!organizerStore.data.review.length" class="empty">No ideas yet.</p>
  <div v-for="item in organizerStore.data.review" :key="item.id" class="card">
    <div style="display: flex; align-items: flex-start; gap: 10px">
      <div style="flex: 1">
        <div style="font-size: 13px; line-height: 1.5">{{ item.text }}</div>
        <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 4px">{{ item.date }}</div>
      </div>
      <button class="del-btn" @click="organizerStore.deleteReview(item.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.copy-btn {
  width: 100%;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  padding: 10px;
  border-radius: var(--radius-md);
  font-size: 13px;
  margin-bottom: 14px;
}
</style>

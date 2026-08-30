<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../stores/organizer.js'
import { fmtCurrency } from '../utils/format.js'
import ShoppingListCard from '../components/Shopping/ShoppingListCard.vue'

const organizerStore = useOrganizerStore()
const activeListId = ref(null)
const showNewListForm = ref(false)
const newListName = ref('')

const lists = computed(() => organizerStore.data.shopping)
const activeList = computed(() => lists.value.find(c => c.id === activeListId.value) || lists.value[0] || null)

const globalTotal = computed(() =>
  lists.value.reduce((s, c) => s + c.items.reduce((s2, it) => s2 + (parseFloat(it.price) || 0), 0), 0)
)
const globalPending = computed(() =>
  lists.value.reduce(
    (s, c) => s + c.items.filter(it => !it.done).reduce((s2, it) => s2 + (parseFloat(it.price) || 0), 0),
    0
  )
)

function addList() {
  const name = newListName.value.trim()
  if (!name) return
  const list = organizerStore.addShoppingList(name)
  activeListId.value = list.id
  newListName.value = ''
  showNewListForm.value = false
}
</script>

<template>
  <div class="card summary-card">
    <div>
      <div class="totals-label">TOTAL</div>
      <div class="totals-value primary">{{ fmtCurrency(globalTotal) }}</div>
    </div>
    <div style="text-align: right">
      <div class="totals-label">PENDING</div>
      <div class="totals-value">{{ fmtCurrency(globalPending) }}</div>
    </div>
  </div>

  <div class="pill-tabs">
    <button
      v-for="list in lists"
      :key="list.id"
      class="pill-tab"
      :class="{ active: activeList && activeList.id === list.id }"
      @click="activeListId = list.id"
    >
      {{ list.name }}
    </button>
    <button class="pill-tab add-list-btn" @click="showNewListForm = !showNewListForm">+ List</button>
  </div>

  <div v-if="showNewListForm" class="new-list-form">
    <input v-model="newListName" type="text" placeholder="List name…" @keydown.enter="addList" />
    <button class="pbtn" @click="addList">Add</button>
    <button class="icon-btn" @click="showNewListForm = false">✕</button>
  </div>

  <p v-if="!lists.length" class="empty">No lists yet — create one above.</p>
  <ShoppingListCard v-else-if="activeList" :key="activeList.id" :list="activeList" />
</template>

<style scoped>
.summary-card {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.totals-label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}
.totals-value {
  font-size: 22px;
  font-weight: 600;
}
.totals-value.primary {
  color: var(--color-primary);
}
.add-list-btn {
  border: 1px dashed var(--color-border);
  background: transparent;
}
.new-list-form {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { fmtCurrency } from '../../utils/format.js'
import ShoppingItemRow from './ShoppingItemRow.vue'

const props = defineProps({ list: { type: Object, required: true } })
const organizerStore = useOrganizerStore()

const editingName = ref(false)
const nameDraft = ref('')
const newItemText = ref('')
const newItemPrice = ref('')
const newItemUrl = ref('')

const total = computed(() => props.list.items.reduce((s, it) => s + (parseFloat(it.price) || 0), 0))
const pending = computed(() =>
  props.list.items.filter(it => !it.done).reduce((s, it) => s + (parseFloat(it.price) || 0), 0)
)
const hasAnyPrice = computed(() => props.list.items.some(it => it.price > 0 || it.price === '0'))

function startRename() {
  nameDraft.value = props.list.name
  editingName.value = true
}
function saveRename() {
  const name = nameDraft.value.trim()
  if (!name) return
  organizerStore.renameShoppingList(props.list.id, name)
  editingName.value = false
}
function addItem() {
  const text = newItemText.value.trim()
  if (!text) return
  organizerStore.addShoppingItem(props.list.id, {
    text,
    price: newItemPrice.value ? parseFloat(newItemPrice.value) : '',
    url: newItemUrl.value.trim(),
  })
  newItemText.value = ''
  newItemPrice.value = ''
  newItemUrl.value = ''
}
</script>

<template>
  <div class="card">
    <div v-if="editingName" class="rename-row">
      <input v-model="nameDraft" style="flex: 1" @keydown.enter="saveRename" />
      <button class="sbtn" @click="saveRename">Save</button>
      <button class="icon-btn" @click="editingName = false">✕</button>
    </div>
    <div v-else class="header-row" :style="{ marginBottom: hasAnyPrice ? '8px' : '12px' }">
      <span class="list-name">{{ list.name }}</span>
      <div class="header-actions">
        <button class="icon-btn" @click="startRename">✎</button>
        <button class="del-btn" @click="organizerStore.deleteShoppingList(list.id)">✕</button>
      </div>
    </div>

    <div v-if="hasAnyPrice" class="totals-row">
      <div>
        <div class="totals-label">TOTAL</div>
        <div class="totals-value primary">{{ fmtCurrency(total) }}</div>
      </div>
      <div style="text-align: right">
        <div class="totals-label">PENDING</div>
        <div class="totals-value">{{ fmtCurrency(pending) }}</div>
      </div>
    </div>

    <ShoppingItemRow v-for="item in list.items" :key="item.id" :list-id="list.id" :item="item" />

    <div class="add-item-form">
      <input v-model="newItemText" type="text" placeholder="Add item…" @keydown.enter="addItem" />
      <div style="display: flex; gap: 6px">
        <input
          v-model="newItemPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          style="width: 90px; flex-shrink: 0"
        />
        <input v-model="newItemUrl" type="url" placeholder="URL (optional)" style="flex: 1" />
        <button class="sbtn" @click="addItem">Add</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rename-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.list-name {
  font-weight: 600;
  font-size: 15px;
}
.header-actions {
  display: flex;
  gap: 4px;
}
.totals-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
}
.totals-label {
  font-size: 10px;
  color: var(--color-text-muted);
}
.totals-value {
  font-size: 14px;
  font-weight: 600;
}
.totals-value.primary {
  color: var(--color-primary);
}
.add-item-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}
</style>

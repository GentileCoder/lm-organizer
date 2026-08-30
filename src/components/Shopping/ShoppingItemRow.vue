<script setup>
import { ref } from 'vue'
import { useOrganizerStore } from '../../stores/organizer.js'
import { fmtCurrency, urlDomain } from '../../utils/format.js'

const props = defineProps({
  listId: { type: Number, required: true },
  item: { type: Object, required: true },
})
const organizerStore = useOrganizerStore()

const editing = ref(false)
const editText = ref('')
const editPrice = ref('')
const editUrl = ref('')

function startEdit() {
  editText.value = props.item.text
  editPrice.value = props.item.price || ''
  editUrl.value = props.item.url || ''
  editing.value = true
}

function save() {
  const text = editText.value.trim()
  if (!text) return
  organizerStore.saveShoppingItem(props.listId, props.item.id, {
    text,
    price: editPrice.value ? parseFloat(editPrice.value) : '',
    url: editUrl.value.trim(),
  })
  editing.value = false
}

const hasPrice = () => props.item.price > 0 || props.item.price === '0'
</script>

<template>
  <div v-if="editing" class="edit-box">
    <input v-model="editText" style="margin-bottom: 8px" />
    <div style="display: flex; gap: 6px; margin-bottom: 8px">
      <input
        v-model="editPrice"
        type="number"
        min="0"
        step="0.01"
        placeholder="Price"
        style="width: 90px; flex-shrink: 0"
      />
      <input v-model="editUrl" type="url" placeholder="URL" style="flex: 1" />
    </div>
    <div style="display: flex; gap: 6px">
      <button class="sbtn" style="flex: 1" @click="save">Save</button>
      <button class="icon-btn" @click="editing = false">✕</button>
    </div>
  </div>

  <div v-else class="item-row">
    <div class="row-main">
      <div class="check" :class="{ done: item.done }" @click="organizerStore.toggleShoppingItem(listId, item.id)"></div>
      <span class="text" :class="{ done: item.done }">{{ item.text }}</span>
      <span v-if="hasPrice()" class="price" :class="{ done: item.done }">{{
        fmtCurrency(parseFloat(item.price))
      }}</span>
      <button class="icon-btn" @click="startEdit">✎</button>
      <button class="del-btn" @click="organizerStore.deleteShoppingItem(listId, item.id)">✕</button>
    </div>
    <a v-if="item.url" :href="item.url" target="_blank" rel="noopener" class="url-link">
      🔗 {{ urlDomain(item.url) }}
    </a>
  </div>
</template>

<style scoped>
.edit-box {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 10px;
  margin-bottom: 8px;
}
.item-row {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
}
.row-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.check {
  width: 16px;
  height: 16px;
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
  color: var(--color-text-faint);
}
.price {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  flex-shrink: 0;
}
.price.done {
  color: var(--color-text-faint);
}
.url-link {
  display: inline-block;
  padding-top: 4px;
  padding-left: 26px;
  font-size: 12px;
  color: var(--color-info);
  text-decoration: none;
}
</style>

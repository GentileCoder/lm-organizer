<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizerStore } from '../../stores/organizer.js'
import { useAuthStore } from '../../stores/auth.js'

const organizerStore = useOrganizerStore()
const authStore = useAuthStore()
const router = useRouter()

// Same reason as LoginView's submit(): the router guard only re-checks auth state on
// navigation, so logging out has to explicitly navigate to /login or the chrome-less
// current view is left showing behind it.
async function logout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}

const statusLabel = computed(() => {
  const s = organizerStore.status
  if (s === 'loading') return 'Loading…'
  if (s === 'saving') return 'Saving…'
  if (s === 'synced') return 'Synced ✓'
  if (s === 'error') return 'Error: ' + (organizerStore.errorMessage || 'sync failed')
  return 'Not connected'
})
const statusClass = computed(() => {
  const s = organizerStore.status
  if (s === 'synced') return 'status-ok'
  if (s === 'error') return 'status-err'
  return 'status-mid'
})
</script>

<template>
  <header class="app-header">
    <h1>My Organizer</h1>
    <div class="header-actions">
      <span class="sync-status" :class="statusClass">{{ statusLabel }}</span>
      <button class="hbtn" @click="logout">Log out</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 13px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}
.app-header h1 {
  font-size: 16px;
  font-weight: 500;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sync-status {
  font-size: 11px;
}
.status-ok {
  color: var(--color-success);
}
.status-err {
  color: var(--color-danger);
}
.status-mid {
  color: var(--color-text-muted);
}
</style>

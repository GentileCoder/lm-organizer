<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizerStore } from '../../stores/organizer.js'
import { useAuthStore } from '../../stores/auth.js'
import { useThemeStore } from '../../stores/theme.js'

const organizerStore = useOrganizerStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()
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

const STAR_PATH = 'M12 2l2.9 6.9 7.4.6-5.6 4.9 1.7 7.3L12 17.9 5.6 21.7l1.7-7.3L1.7 9.5l7.4-.6L12 2z'

// Decorative touches for the three fan-identity themes — nothing here reproduces any
// club/federation crest artwork, just colors, a star motif, and a flag-echoing stripe.
const isCuba = computed(() => themeStore.themeId === 'cuba')
const starsInfo = computed(() => {
  if (themeStore.themeId === 'realmadrid') return { count: 3, label: 'Hala Madrid' }
  if (themeStore.themeId === 'brazil') return { count: 5, label: 'Pentacampeão' }
  return null
})
const stripeBands = computed(() => {
  if (themeStore.themeId === 'realmadrid') return ['var(--color-primary)', 'var(--color-gold)']
  if (themeStore.themeId === 'brazil') return ['var(--color-success)', 'var(--color-primary)', 'var(--color-flag-blue)']
  if (themeStore.themeId === 'cuba') {
    return ['var(--color-flag-blue)', '#ffffff', 'var(--color-primary)', '#ffffff', 'var(--color-flag-blue)']
  }
  return []
})
</script>

<template>
  <header class="app-header">
    <div class="title-row">
      <svg v-if="isCuba" width="14" height="14" viewBox="0 0 24 24" fill="var(--color-gold)">
        <path :d="STAR_PATH" />
      </svg>
      <h1>My Organizer</h1>
    </div>
    <div class="header-actions">
      <span class="sync-status" :class="statusClass">{{ statusLabel }}</span>
      <button class="hbtn" @click="logout">Log out</button>
    </div>
  </header>
  <div v-if="starsInfo" class="fan-row">
    <svg v-for="n in starsInfo.count" :key="n" width="10" height="10" viewBox="0 0 24 24" fill="var(--color-gold)">
      <path :d="STAR_PATH" />
    </svg>
    <span class="fan-label">{{ starsInfo.label }}</span>
  </div>
  <div v-if="stripeBands.length" class="stripe">
    <div v-for="(c, i) in stripeBands" :key="i" class="stripe-band" :style="{ background: c }"></div>
  </div>
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
.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.app-header h1 {
  font-family: var(--font-heading);
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
.fan-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.fan-label {
  font-size: 9px;
  color: var(--color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-left: 4px;
}
.stripe {
  display: flex;
  height: 3px;
}
.stripe-band {
  flex: 1;
}
</style>

<script setup>
import { computed, watch } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { useOrganizerStore } from './stores/organizer.js'
import AppHeader from './components/layout/AppHeader.vue'
import AppNav from './components/layout/AppNav.vue'

const authStore = useAuthStore()
const organizerStore = useOrganizerStore()

const showChrome = computed(() => authStore.isAuthenticated)

watch(
  () => authStore.user,
  user => {
    if (user) organizerStore.load()
  },
  { immediate: true }
)
</script>

<template>
  <AppHeader v-if="showChrome" />
  <AppNav v-if="showChrome" />
  <main id="main-content">
    <RouterView />
  </main>
</template>

<style scoped>
#main-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}
</style>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../../stores/theme.js'

// Sunset's decorative background glow — the only theme with an atmospheric backdrop
// element. Fixed/behind everything, pointer-events disabled so it never blocks taps.
const themeStore = useThemeStore()
const show = computed(() => themeStore.themeId === 'sunset')
</script>

<template>
  <div v-if="show" class="sun-glow"></div>
</template>

<style scoped>
.sun-glow {
  position: fixed;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: var(--color-primary);
  filter: blur(50px);
  opacity: 0.35;
  pointer-events: none;
  z-index: -1;
}
</style>

<script setup>
import { useThemeStore } from '../stores/theme.js'

const themeStore = useThemeStore()
</script>

<template>
  <div class="section-label" style="margin-bottom: 10px">Appearance</div>

  <div class="theme-grid">
    <button
      v-for="theme in themeStore.themes"
      :key="theme.id"
      class="theme-card"
      :class="{ active: themeStore.themeId === theme.id }"
      @click="themeStore.setTheme(theme.id)"
    >
      <span class="swatch" :style="{ background: theme.preview.bg }">
        <span class="swatch-dot" :style="{ background: theme.preview.accent }"></span>
      </span>
      <span class="theme-name">{{ theme.name }}</span>
    </button>
  </div>

  <div class="card mode-card">
    <div class="section-label" style="margin-bottom: 10px">Light / dark</div>
    <div class="mode-row">
      <button class="mode-btn" :class="{ active: themeStore.mode === 'light' }" @click="themeStore.setMode('light')">
        Light
      </button>
      <button class="mode-btn" :class="{ active: themeStore.mode === 'dark' }" @click="themeStore.setMode('dark')">
        Dark
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--color-surface-raised);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px 6px;
}
.theme-card.active {
  border-color: var(--color-primary);
}
.swatch {
  width: 100%;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.swatch-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.theme-name {
  font-size: 12px;
  color: var(--color-text);
  text-align: center;
}
.mode-card {
  padding: 14px;
}
.mode-row {
  display: flex;
  gap: 8px;
}
.mode-btn {
  flex: 1;
  padding: 10px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
}
.mode-btn.active {
  background: var(--color-primary);
  color: var(--color-primary-text, #fff);
  border-color: var(--color-primary);
}
</style>

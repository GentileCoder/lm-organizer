<script setup>
const links = [
  { to: { name: 'Calendar' }, label: '▦ Calendar' },
  { to: { name: 'Goals' }, label: '◎ Goals' },
  { to: { name: 'Shopping' }, label: '⊕ Shopping' },
  { to: { name: 'Finance' }, label: '€ Finance' },
  { to: { name: 'Investment' }, label: '📈 Invest' },
  { to: { name: 'Workspace' }, label: '✏ Notes' },
]
</script>

<template>
  <nav class="app-nav">
    <RouterLink v-for="link in links" :key="link.label" :to="link.to" class="nav-btn" active-class="active">
      {{ link.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}
.app-nav::-webkit-scrollbar {
  display: none;
}
.nav-btn {
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  white-space: nowrap;
  text-decoration: none;
}
.nav-btn.active {
  background: var(--color-primary);
  color: #fff;
}
</style>

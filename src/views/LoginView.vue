<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { usernameToEmail } from '../utils/accounts.js'

const authStore = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')

async function submit() {
  if (!username.value.trim() || !password.value) return
  // The router only re-checks auth state on navigation, not just because a reactive
  // ref changed — a successful sign-in has to explicitly navigate away from /login,
  // or the app silently sits on the login screen despite being authenticated.
  const ok = await authStore.login(usernameToEmail(username.value), password.value)
  if (ok) router.push({ name: 'Calendar' })
}
</script>

<template>
  <div class="lock-screen">
    <form class="lock-card" @submit.prevent="submit">
      <div class="lock-icon">🔒</div>
      <h2 class="lock-title">My Organizer</h2>
      <p class="lock-sub">Sign in to continue</p>
      <input v-model="username" type="text" autocomplete="username" placeholder="Username" />
      <input v-model="password" type="password" autocomplete="current-password" placeholder="Password" />
      <button class="lock-btn" type="submit" :disabled="authStore.loading">
        {{ authStore.loading ? 'Signing in…' : 'Sign in' }}
      </button>
      <p class="lock-err">{{ authStore.error }}</p>
    </form>
  </div>
</template>

<style scoped>
.lock-screen {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.lock-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.lock-icon {
  font-size: 40px;
  margin-bottom: 4px;
}
.lock-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}
.lock-sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}
.lock-btn {
  width: 100%;
  background: var(--color-primary);
  color: var(--color-primary-text, #fff);
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  margin-top: 4px;
}
.lock-btn:disabled {
  background: var(--color-border);
  opacity: 0.6;
  cursor: default;
}
.lock-err {
  font-size: 12px;
  color: var(--color-danger);
  min-height: 16px;
}
</style>

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Firebase Hosting's rewrite in firebase.json ("**" -> /index.html) handles the
// deep-link fallback a static host would otherwise need, so plain history mode works.
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
    { path: '/', name: 'Calendar', component: () => import('../views/CalendarView.vue') },
    { path: '/goals', name: 'Goals', component: () => import('../views/GoalsView.vue') },
    { path: '/shopping', name: 'Shopping', component: () => import('../views/ShoppingView.vue') },
    { path: '/finance', name: 'Finance', component: () => import('../views/FinanceView.vue') },
    { path: '/investment', name: 'Investment', component: () => import('../views/InvestmentView.vue') },
    { path: '/workspace', name: 'Workspace', component: () => import('../views/WorkspaceView.vue') },
    { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: { name: 'Calendar' } },
  ],
})

router.beforeEach(to => {
  const authStore = useAuthStore()
  if (to.name !== 'Login' && !authStore.isAuthenticated) return { name: 'Login' }
  if (to.name === 'Login' && authStore.isAuthenticated) return { name: 'Calendar' }
  return true
})

export default router

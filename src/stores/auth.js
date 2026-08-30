import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)
  const error = ref('')
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  let readyPromise = null
  /**
   * Idempotent — call once from main.js and await it before mounting, so the router's
   * first navigation guard sees a real auth state instead of racing Firebase's restore.
   */
  function init() {
    if (!readyPromise) {
      readyPromise = new Promise(resolve => {
        onAuthStateChanged(auth, u => {
          user.value = u
          ready.value = true
          resolve()
        })
      })
    }
    return readyPromise
  }

  async function login(email, password) {
    error.value = ''
    loading.value = true
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (e) {
      error.value = mapAuthError(e.code)
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await signOut(auth)
  }

  function mapAuthError(code) {
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-email'
    ) {
      return 'Wrong username or password.'
    }
    if (code === 'auth/too-many-requests') return 'Too many attempts — try again later.'
    return 'Sign-in failed — check your connection and try again.'
  }

  return { user, ready, error, loading, isAuthenticated, init, login, logout }
})

import { auth } from '../firebase.js'
import { useAuthStore } from '../stores/auth.js'

export async function fetchWithAuth(url, options = {}) {
  const headers = new Headers(options.headers)

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken()
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    handleSessionExpired()
    const err = new Error('Session expired')
    err.status = 401
    throw err
  }
  return response
}

export function handleSessionExpired() {
  useAuthStore().logout()
  // Dynamic import breaks the cycle: router → store → api → httpClient → router.
  // A static import here makes the module graph circular and yields an
  // `undefined` router at boot, intermittently and only in the prod build.
  import('../router/index.js').then(({ default: router }) => {
    if (router.currentRoute?.value?.name !== 'Login') router.push({ name: 'Login' })
  })
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import { useAuthStore } from './stores/auth.js'

import './styles/index.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)

// vue-router triggers its initial navigation (and the beforeEach guard) as soon as
// app.use(router) runs — not when the app mounts. Installing it only after Firebase
// has restored (or not found) a session means the first guard check never races
// onAuthStateChanged and wrongly bounces an already-logged-in user to /login.
useAuthStore()
  .init()
  .then(() => {
    app.use(router)
    app.mount('#app')
  })

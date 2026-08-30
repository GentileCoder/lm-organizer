import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Firebase Hosting serves this from the domain root (gentilecoder.web.app or a
// custom domain), not a subpath, so no `base` override is needed.
export default defineConfig({
  plugins: [vue()],
  server: { port: 3080, strictPort: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})

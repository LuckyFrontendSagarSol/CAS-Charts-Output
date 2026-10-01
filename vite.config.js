import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Same setup as the public site: Tailwind v4 runs as a Vite plugin, so there is
// no tailwind.config.js or postcss.config.js — the theme lives in src/index.css.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/components/ui/Button` instead of `../../components/ui/Button`. Keep
    // jsconfig.json in step with this so the editor resolves it too.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor'
          if (id.includes('node_modules/react-router-dom')) return 'router'
          if (id.includes('node_modules/framer-motion')) return 'motion'
        },
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./mobile-app/src"),
    },
  },
  root: './mobile-app',
  build: {
    outDir: '../dist-mobile',
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    host: true,
    open: true
  },
  base: '/'
})

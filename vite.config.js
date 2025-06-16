import { defineConfig } from 'vite'

export default defineConfig({
  base: '/lanpad/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://0.0.0.0:4444',
        ws: true,
        changeOrigin: true
      }
    }
  }
}) 
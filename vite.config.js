import { defineConfig } from 'vite'

export default defineConfig({
  base: '/lanpad/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  }
}) 
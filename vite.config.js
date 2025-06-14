import { defineConfig } from 'vite'

export default defineConfig({
  base: '/lanpad/',
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        pad: 'pad.html'
      }
    }
  }
}) 
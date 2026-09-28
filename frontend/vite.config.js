import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/Student': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/Course': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})

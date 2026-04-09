import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: './',
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    origin: 'http://localhost:5173',
    port: 5173
  }
})

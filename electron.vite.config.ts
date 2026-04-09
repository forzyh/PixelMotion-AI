import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist-electron',
      lib: {
        entry: 'electron/main.ts',
        formats: ['cjs']
      }
    },
    external: ['sharp', 'electron-store', 'openai']
  },
  preload: {
    build: {
      outDir: 'dist-electron',
      lib: {
        entry: 'electron/preload.ts',
        formats: ['cjs']
      }
    }
  },
  renderer: {
    plugins: [react()],
    base: './',
    root: '.',
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
  }
})

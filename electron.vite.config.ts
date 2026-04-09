import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    root: 'electron',
    build: {
      outDir: '../dist-electron',
      lib: {
        entry: 'main.ts',
        formats: ['cjs']
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '../src')
      }
    },
    external: ['sharp', 'electron-store', 'openai']
  },
  preload: {
    root: 'electron',
    build: {
      outDir: '../dist-electron',
      lib: {
        entry: 'preload.ts',
        formats: ['cjs']
      }
    }
  },
  renderer: {
    root: '.',
    plugins: [react()],
    base: './',
    build: {
      outDir: '../dist/renderer',
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

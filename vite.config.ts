import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/SanPedro_Transportes/', // Crucial for GitHub Pages
  server: {
    host: true,
    port: 5173,
    strictPort: true
  },
  preview: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html') // Explicit entry point
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // Optional but helpful for imports
    }
  }
})
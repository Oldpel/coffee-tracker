import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'trpc-vendor': ['@trpc/client', '@trpc/react-query', '@tanstack/react-query'],
          'ui-vendor': ['framer-motion', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})

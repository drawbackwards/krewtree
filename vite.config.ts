import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    // Use EXPOSE_HOST=true to allow network access (e.g. for testing on device)
    host: process.env.EXPOSE_HOST === 'true' ? true : 'localhost',
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@site': resolve(__dirname, './src/site'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    passWithNoTests: true,
  },
})

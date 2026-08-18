import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [resolve(__dirname, '../')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: resolve(__dirname, '../component-tests/test-setup.ts'),
    include: [
      resolve(__dirname, '../component-tests/**/*.{test,spec}.{ts,tsx}'),
    ],
  },
})
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join('; ')

const apiProxy = {
  '/api': {
    target: 'https://localhost:5000',
    changeOrigin: true,
    secure: false, // backend uses a self-signed cert
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    proxy: apiProxy,
    headers: { 'Content-Security-Policy': csp }, // CSP on the built frontend
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})

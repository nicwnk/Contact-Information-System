import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// For local development only: `npm run dev` forwards API calls to service-a.
// In Docker, the proxy container does this routing instead.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/contacts': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api\/contacts/, ''),
      },
    },
  },
})

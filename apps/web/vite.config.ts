import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In dev we proxy API paths to the Fastify server (default :4000) so the web app
// talks to its own origin — no CORS, and the Better Auth session cookie is
// same-origin. Override the upstream with VITE_API_PROXY_TARGET if your API runs
// elsewhere. In production set VITE_API_BASE_URL to point at the API directly.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
      '/health': { target: apiTarget, changeOrigin: false },
      '/me': { target: apiTarget, changeOrigin: false },
    },
  },
  preview: { port: 4173 },
  build: { sourcemap: true },
});

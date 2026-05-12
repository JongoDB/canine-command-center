import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In dev we proxy the API path prefixes to the Fastify server (default :4000)
// so the web app talks to its own origin — no CORS, and the Better Auth session
// cookie is same-origin (a SameSite=Lax cookie isn't sent on cross-site fetch,
// so the proxy is required, not just convenient). Override the upstream with
// VITE_API_PROXY_TARGET if your API runs elsewhere. In production set
// VITE_API_BASE_URL to point the client at the API directly.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000';

// Every top-level path the API owns. Keep in sync with apps/api/src/server.ts.
const API_PREFIXES = ['/api', '/health', '/me', '/dogs', '/breeds', '/v1', '/media'];
const proxy = Object.fromEntries(
  API_PREFIXES.map((p) => [p, { target: apiTarget, changeOrigin: false }]),
);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
  },
  preview: { port: 4173 },
  build: { sourcemap: true },
});

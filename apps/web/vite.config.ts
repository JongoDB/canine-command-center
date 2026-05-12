import type { IncomingMessage } from 'node:http';
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

// Some of those prefixes ALSO name client routes (/breeds, /breeds/:slug,
// /dogs/:id, /dogs/:id/edit). When the browser does a full-page navigation
// there (refresh, typed URL, opened-in-new-tab) it sends `Accept: text/html` —
// serve the SPA shell instead of proxying to the API (which would return a 401
// JSON blob). The `ApiClient` always sends `Accept: application/json`, so its
// fetches still get proxied. `/api` is exempt: GET /api/auth/verify-email is
// itself a full-page navigation that must reach the API.
const bypassForHtmlNav = (req: IncomingMessage) =>
  String(req.headers.accept ?? '').includes('text/html') ? '/index.html' : undefined;
const proxy = Object.fromEntries(
  API_PREFIXES.map((p) => [
    p,
    {
      target: apiTarget,
      changeOrigin: false,
      ...(p === '/api' ? {} : { bypass: bypassForHtmlNav }),
    },
  ]),
);

// When the dev server is reached via a tunnel (Cloudflare, ngrok, …) Vite
// rejects the unfamiliar Host header. List those hostnames in
// VITE_ALLOWED_HOSTS (comma-separated) — or set it to `true` to allow any host.
const allowedHostsEnv = process.env.VITE_ALLOWED_HOSTS?.trim();
const allowedHosts =
  allowedHostsEnv === 'true'
    ? true
    : allowedHostsEnv
      ? allowedHostsEnv
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean)
      : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
    ...(allowedHosts ? { allowedHosts } : {}),
  },
  preview: { port: 4173 },
  build: { sourcemap: true },
});

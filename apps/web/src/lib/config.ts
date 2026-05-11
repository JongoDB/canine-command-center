/**
 * Where the API lives. Empty string ⇒ same origin (dev: Vite proxies /api,
 * /health, /me to the Fastify server — see vite.config.ts). In production set
 * VITE_API_BASE_URL to the API's origin, e.g. https://api.example.com.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

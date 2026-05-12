import { createAuthClient } from 'better-auth/react';
import { API_BASE_URL } from './config';

// Better Auth requires an *absolute* base URL. In dev API_BASE_URL is '' (the
// web app proxies /api to the Fastify server on its own origin), so anchor it
// to the current origin; in prod VITE_API_BASE_URL is an absolute API origin.
const authBaseUrl = `${API_BASE_URL || window.location.origin}/api/auth`;

/**
 * Better Auth browser client. Sessions are cookie-based (the API sets an
 * httpOnly cookie); `credentials: 'include'` makes the browser send it.
 */
export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  fetchOptions: { credentials: 'include' },
});

export const { useSession, signIn, signUp, signOut } = authClient;

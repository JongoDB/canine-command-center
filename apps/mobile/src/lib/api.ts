import { ApiClient } from '@ccc/shared';
import { authClient } from './auth-client';
import { API_BASE_URL } from './config';

/**
 * Typed client for the non-auth API surface (`/health`, `/me`, `/dogs*`, …).
 * Mobile is cookie-less in the browser sense — the Better Auth Expo plugin
 * keeps the session token in `expo-secure-store`. We forward it on every
 * request via the `Cookie` header it exposes (`authClient.getCookie()`), which
 * is what the auth client itself does internally.
 */
export const api = new ApiClient({
  baseUrl: API_BASE_URL,
  credentials: false,
  headers: () => {
    const headers: Record<string, string> = {};
    const cookie = authClient.getCookie?.() ?? '';
    if (cookie) headers.Cookie = cookie;
    return headers;
  },
});

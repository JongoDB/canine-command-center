import { createAuthClient } from 'better-auth/react';
import { API_BASE_URL } from './config';

/**
 * Better Auth browser client. Sessions are cookie-based (the API sets an
 * httpOnly cookie); `credentials: 'include'` makes the browser send it.
 */
export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  fetchOptions: { credentials: 'include' },
});

export const { useSession, signIn, signUp, signOut } = authClient;

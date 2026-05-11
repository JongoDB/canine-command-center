import { ApiClient } from '@ccc/shared';
import { API_BASE_URL } from './config';

/**
 * Typed client for the non-auth API surface (`/health`, `/me`, and — from M1.x —
 * `/dogs`, `/program`, `/chat`, …). `credentials: true` sends the Better Auth
 * session cookie.
 */
export const api = new ApiClient({ baseUrl: API_BASE_URL, credentials: true });

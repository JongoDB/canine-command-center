import { ApiClient } from '@ccc/shared';
import { API_BASE_URL } from './config';

/**
 * Typed client for the non-auth API surface (`/health` now; `/dogs`, `/program`,
 * `/chat`, … from M1.x). Mobile is cookie-less — the Better Auth Expo plugin
 * keeps the session token in SecureStore. `/health` needs no auth; when the
 * first authenticated route lands (M1.1) we forward the stored token here via
 * `authClient.getCookie()` in `headers`.
 */
export const api = new ApiClient({ baseUrl: API_BASE_URL, credentials: false });

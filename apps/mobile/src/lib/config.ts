/**
 * Where the API lives. Mobile can't proxy like the web dev server, so this is
 * an absolute URL. Override with EXPO_PUBLIC_API_URL (inlined at build time).
 *   - iOS simulator:      http://localhost:4000  (the default)
 *   - Android emulator:   http://10.0.2.2:4000
 *   - physical device:    http://<your-machine-LAN-ip>:4000
 */
export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

/** The deep-link scheme (matches app.json `expo.scheme`). */
export const APP_SCHEME = 'caninecommandcenter';

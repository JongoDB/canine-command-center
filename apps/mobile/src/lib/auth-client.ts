import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, APP_SCHEME } from './config';

/**
 * Better Auth client for the mobile app. The Expo plugin persists the session
 * token in the device keychain (SecureStore) and replays it on requests, so the
 * cookie-less mobile flow works the same as the web's cookie flow.
 */
export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  plugins: [
    expoClient({
      scheme: APP_SCHEME,
      storagePrefix: 'ccc',
      storage: SecureStore,
    }),
  ],
});

export const { useSession, signIn, signUp, signOut } = authClient;

import { BRANDING } from '@ccc/shared';
import { tokens } from '@ccc/ui';

// Placeholder entrypoint. The Expo / React Native app (Expo Router, auth
// screens, the screens from docs/DESIGN.md, push, secure token store) is built
// in milestone M0.6. This stub only proves the @ccc/shared and @ccc/ui
// workspace links resolve.
export const placeholder = {
  app: BRANDING.appName,
  background: tokens.color.black,
} as const;

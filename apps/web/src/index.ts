import { BRANDING } from '@ccc/shared';
import { tokens } from '@ccc/ui';

// Placeholder entrypoint. The Vite + React + React Router app (auth screens,
// PWA manifest, the screens from docs/DESIGN.md) is built in milestone M0.6.
// This stub only proves the @ccc/shared and @ccc/ui workspace links resolve.
export const placeholder = {
  app: BRANDING.appName,
  background: tokens.color.black,
} as const;

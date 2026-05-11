/**
 * Single source of truth for user-facing names.
 *
 * The code-level slug stays `canine-command-center` everywhere (repo, npm
 * scope `@ccc/*`, env, etc.); the on-screen names live here so a rename is one
 * edit. Both are placeholders the owner may change (see docs/PRODUCT.md).
 */
export const BRANDING = {
  /** App display name shown to users. */
  appName: 'Canine Command Center',
  /** Short form for tight spots (nav bars, etc.). */
  appNameShort: 'Command Center',
  /** Stable code-level slug. Do not change. */
  slug: 'canine-command-center',
  /** The in-app AI assistant's name (Claude on the backend). */
  assistantName: 'Scout',
  /** One-liner used in onboarding / store listings. */
  tagline: 'Raise your dog like a pro — with Scout, your in-app expert.',
} as const;

export type Branding = typeof BRANDING;

# @ccc/mobile

Mobile client for Canine Command Center — Expo / React Native (iOS + Android),
Expo Router, EAS for builds (Phase 6). Shares domain logic with web via
`@ccc/shared` and design tokens via `@ccc/ui`. See
[`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) and
[`../../docs/DESIGN.md`](../../docs/DESIGN.md).

## Run it

```sh
# 1) API (separate terminal), reachable from the device/simulator:
cd ../api && cp .env.example .env && pnpm db:up && pnpm db:migrate && pnpm dev   # :4000

# 2) the app:
pnpm dev                       # Expo dev server → press i (iOS sim) / a (Android emu) / scan in Expo Go
# Point it at the API if not on an iOS simulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 pnpm dev          # Android emulator
EXPO_PUBLIC_API_URL=http://<your-LAN-ip>:4000 pnpm dev     # physical device
```

`pnpm typecheck` · `pnpm native:prebuild` (generates `ios/`/`android/` —
git-ignored) · real release builds are EAS (M6.7).

## What's here (M0.6b)

Auth against the API: `sign-in`, `sign-up`, `forgot-password`, and an empty
authenticated `/` (app shell + an API-health pill + sign-out). Sessions are
cookie-less — `@better-auth/expo` keeps the token in the device keychain
(`expo-secure-store`). The session gate lives in `app/_layout.tsx`.

```
app/_layout.tsx        root Stack + the session-gate redirect
app/index.tsx          authenticated home
app/sign-in.tsx, sign-up.tsx, forgot-password.tsx
src/lib/auth-client.ts  Better Auth client + the Expo plugin (SecureStore)
src/lib/api.ts          @ccc/shared ApiClient for the non-auth surface
src/lib/config.ts       API_BASE_URL (EXPO_PUBLIC_API_URL), the deep-link scheme
src/theme.ts            re-exports @ccc/ui tokens, lightly aliased for RN
src/components/ui.tsx   Screen / Field / PrimaryButton / Card / … (RN, from the tokens)
metro.config.js         monorepo Metro config (watch the workspace, resolve hoisted deps)
```

> **Status:** M0.6b — skeleton + auth. Known follow-ups (Phase 1+): email-link
> verification / password-reset currently route through the **web** app — the
> deep-link (`caninecommandcenter://…`) versions, forwarding the stored session
> token on authenticated API calls (`authClient.getCookie()`), loading the
> Bebas/DM Sans/Space Mono webfonts via `expo-font`, push notifications, app
> icon/splash, and the real screens (Today · Program · Scout · Health · More)
> come later (see [`../../docs/ROADMAP.md`](../../docs/ROADMAP.md)).

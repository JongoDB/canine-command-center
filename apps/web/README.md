# @ccc/web

Web client for Canine Command Center — Vite + React + React Router, installable
PWA (static manifest for now; service worker comes later). Shares domain logic
with mobile via `@ccc/shared` and design tokens via `@ccc/ui`. See
[`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) and
[`../../docs/DESIGN.md`](../../docs/DESIGN.md).

## Run it

```sh
# 1) start the API (separate terminal):
cd ../api && cp .env.example .env && pnpm db:up && pnpm db:migrate && pnpm dev
# 2) start the web app:
pnpm dev          # http://localhost:5173  (proxies /api, /health, /me → :4000)
```

`pnpm build` → static bundle in `dist/` · `pnpm preview` → serve the build on
`:4173` · `pnpm typecheck`.

In dev the API is reached via Vite's proxy (same origin → no CORS, the Better
Auth session cookie is same-origin). In production set `VITE_API_BASE_URL` to the
API's origin.

## What's here (M0.6a)

Auth end-to-end against the API: `/sign-up`, `/sign-in`, `/verify-email` (the
email-link landing page), `/forgot-password`, `/reset-password`, and an empty
authenticated `/` (the app shell + an API-health pill + sign-out). Verification
and reset emails land in mailpit in dev (`pnpm db:up` → http://localhost:8025).

```
src/
  main.tsx              React root (BrowserRouter)
  App.tsx               routes
  styles.css            dark "K9 field journal" theme (mirrors @ccc/ui tokens)
  lib/config.ts          API_BASE_URL
  lib/auth-client.ts     Better Auth browser client (cookie sessions)
  lib/api.ts             @ccc/shared ApiClient for the non-auth surface
  components/RequireAuth.tsx, Centered.tsx
  screens/SignIn, SignUp, VerifyEmail, ForgotPassword, ResetPassword, Home
```

> **Status:** M0.6a — skeleton + auth. The real screens (Today · Program ·
> Scout · Health · More) land from Phase 1; component/E2E tests from M1.4 /
> M6.4. (The Expo mobile client is M0.6b.)

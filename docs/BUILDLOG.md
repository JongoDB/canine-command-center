# Build log

Running record of autonomous development — what's done, what's in flight, and
decisions made along the way. Newest first. (Per `docs/WORKING_AGREEMENT.md`.)

Status key: ✅ merged · 🚧 in flight · ⏳ pending · 🧪 awaiting your UI/UX checkpoint

---

## Phase 0 — Foundations

- 🚧 **M0.6a — Web client skeleton** — _in flight_ (branch `feat/m0.6a-web-client`).
  `apps/web`: Vite 6 + React 18 + React Router 6; static PWA manifest; the Better
  Auth browser client (cookie sessions) + the `@ccc/shared` `ApiClient`; auth
  screens — sign up / sign in / `/verify-email` (the email-link landing page,
  hands the token to the API and lands the user back home auto-signed-in) /
  forgot + reset password; an empty authenticated `/` (app shell + an API-health
  pill + sign-out); dark "K9 field journal" theme (mirrors `@ccc/ui` tokens). Dev
  proxy (`/api`, `/health`, `/me` → the Fastify server) so it's same-origin (no
  CORS, cookie works). Touches `apps/api`: added `WEB_BASE_URL` so verification /
  reset emails link to the web app, not the API. Removed unused `declaration`/
  `declarationMap` from `tsconfig.base.json` (fixed TS2742 on the Better Auth
  client). Verified: full gate green; built bundle (~66 KB gz JS); dev server +
  API + proxy + mailpit smoke-tested (signup → verification email links to
  `http://localhost:5173/verify-email?token=…`). _(M0.6b — the Expo mobile
  client plus the shared `@ccc/ui` primitives — follows.)_
- ✅ **M0.5 — Shared package v1** — delivered incrementally (not a standalone
  PR). The v1 cut — `BRANDING` (M0.1), `@ccc/ui` design tokens (M0.1), the
  auth-adjacent types + the typed `ApiClient` (M0.4, PR #12) — is in. The
  remaining domain schemas (dog / breed / program / conversation / …) land with
  their features from M1.1 onward.
- ✅ **M0.4 — Auth** — PR #12, merged. Better Auth 1.6 (email/password + email
  verification + password reset) on the API, mounted at `/api/auth/*` (a Fastify
  ↔ Fetch bridge that special-cases `Set-Cookie`); `requireSession` preHandler
  (decorates `request.auth`, 401s the envelope without a session) +
  `attachSession`; `GET /me`; `src/lib/email.ts` (SMTP/mailpit in dev, logs if
  unset, captured in tests); web uses the session cookie, mobile bearer tokens in
  M0.6b. `auth.test.ts` exercises sign-up → (verification email captured) →
  verify-email → sign-in → `/me` → sign-out + password-reset — DB-backed, self-
  skips without Postgres, runs against the CI service. CI `Test` step now runs
  with `DATABASE_URL` → the Postgres service. `zod` bumped monorepo-wide to `^4`
  (better-auth peer dep); `nodemailer` `^7.0.11` (GHSA-rcmh-qjqh-p98v). _Note:
  Better Auth 1.6 dropped `/forget-password` — the reset-request endpoint is
  `/request-password-reset`._
- ✅ **M0.3 — API skeleton + DB** — PR #11, merged. `apps/api`: Fastify 5
  server (`buildServer()` — helmet, CORS, `{ error: {…} }` envelope, graceful
  shutdown) with `GET /health` (liveness; DB sub-status) and `GET /health/ready`
  (readiness, 503 if DB down); validated env (`src/config/env.ts`, zod, `dotenv`);
  Postgres via Drizzle ORM (`src/db/client.ts` — lazy pool, `pingDb()`); first
  migration (`drizzle/0000_init.sql` — Better Auth `user` / `session` / `account`
  / `verification`); `pnpm db:up|migrate|check|generate|studio`;
  `infra/docker-compose.yml` (postgres + mailpit + minio); CI `ci` job runs
  `db:check` against a throwaway Postgres service (idempotently). `drizzle-orm`
  pinned ≥ 0.45.2 (GHSA-gpj5-g38j-94v9). Verified locally end-to-end; full gate
  green.
- ✅ **M0.2 — CI + branch protection** — PR #2, merged. GitHub Actions `CI`
  workflow (job `ci`: install → typecheck → lint → format:check → test → build —
  later in M0.3 a `db:check` step + Postgres service were added; advisory
  `audit` job; runs on PRs and pushes to `main`); Dependabot (npm +
  github-actions, weekly); branch protection on `main` requiring the `ci` check
  (+ strict / linear history / no force-push / no deletions; admins not enforced
  so milestone PRs can self-merge after green CI).
- ✅ **M0.1 — Monorepo scaffold** — PR #1, merged. pnpm workspaces;
  `apps/{api,web,mobile}` + `packages/{shared,ui}` + `infra/`; TypeScript
  (strict), ESLint 9 (flat config), Prettier, Vitest; root scripts (`dev:*`,
  `build`, `typecheck`, `lint`, `test`, `format`, `db:*`); PR template; this
  build log. `packages/shared` seeded with `BRANDING` constants; `packages/ui`
  seeded with the design tokens from `docs/DESIGN.md`. App packages are stubs
  (real API in M0.3, clients in M0.6). Gate green on a clean checkout.
- ⏳ **M0.6b — Mobile client skeleton (Expo)** + the shared `@ccc/ui` primitives.

## Decisions

- **2026-05-11** — Stack confirmed by owner ("you choose" → as in
  `docs/ARCHITECTURE.md`): pnpm monorepo, Fastify + Postgres + Drizzle +
  Better-Auth API, Expo mobile, Vite/React PWA web, shared TS core. Owner gave
  the go and signed off on the humane-first training stance + the gated opt-in
  Protection / Bite-Sport track.
- **2026-05-11** — npm scope `@ccc/*` for workspace packages (`@ccc/api`,
  `@ccc/web`, `@ccc/mobile`, `@ccc/shared`, `@ccc/ui`); never published
  (`private`).
- **2026-05-11** — `.npmrc` sets `node-linker=hoisted` for Metro/Expo
  compatibility with pnpm (standard for RN + pnpm monorepos).
- **2026-05-11** — TS base config uses `module: ESNext` with
  `moduleResolution: Bundler` and `verbatimModuleSyntax` (avoids the NodeNext
  `.js`-extension friction). The API runs via `tsx` in dev and is bundled with
  `tsup` for prod; `packages/shared` and `packages/ui` are consumed as
  TypeScript source (`main` → `src/index.ts`), so they need no build step —
  each consumer's bundler/compiler builds them.
- **2026-05-11** — Prettier formats Markdown too; the `docs/*.md` files were
  reformatted on the first run after `.prettierrc.json` landed (M0.1).

## Open items / deferrals

- **GitHub Actions on Node 20** — `actions/checkout@v4`, `actions/setup-node@v4`,
  `pnpm/action-setup@v4` log a deprecation warning (Node 20 → forced Node 24 from
  2026-06-02). Non-blocking; Dependabot (github-actions ecosystem) will bump them,
  or bump manually before then.
- **`pnpm audit`** still reports 3 _moderate_ transitive advisories — surfaced by
  the advisory `audit` CI job; Dependabot will chip at them. No high/critical open.
- **M0.5 calculators** (calorie/portion, age-stage, vaccine-schedule) — deferred
  to the milestones that actually use them (M4.1 / M3.x) rather than stubbing now.

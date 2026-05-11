# Build log

Running record of autonomous development — what's done, what's in flight, and
decisions made along the way. Newest first. (Per `docs/WORKING_AGREEMENT.md`.)

Status key: ✅ merged · 🚧 in flight · ⏳ pending · 🧪 awaiting your UI/UX checkpoint

---

## Phase 0 — Foundations

- 🚧 **M0.3 — API skeleton + DB** — _in flight_ (branch `feat/m0.3-api-skeleton-db`).
  `apps/api`: Fastify 5 server (`buildServer()` — helmet, CORS, `{ error: {…} }`
  envelope, graceful shutdown) with `GET /health` (liveness; DB sub-status) and
  `GET /health/ready` (readiness, 503 if DB down); validated env (`src/config/env.ts`,
  zod, `dotenv`); Postgres via Drizzle ORM (`src/db/client.ts` — lazy pool,
  `pingDb()`); first migration (`drizzle/0000_init.sql` — Better Auth `user` /
  `session` / `account` / `verification`); `pnpm db:up|migrate|check|generate|studio`;
  `infra/docker-compose.yml` (postgres + mailpit + minio); CI `ci` job now runs
  `db:check` against a throwaway Postgres service (idempotently). Verified
  locally: migrations apply on a fresh Dockerised Postgres (and re-apply
  cleanly); `pnpm dev` → `/health` returns `db: ok`, `/health/ready` 200, 404s
  use the envelope; full gate green.
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
- ⏳ **M0.4 — Auth**
- ⏳ **M0.5 — Shared package v1** (started in M0.1; extended alongside M0.3/M0.4)
- ⏳ **M0.6 — Client skeletons (mobile + web)**

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

- (none yet)

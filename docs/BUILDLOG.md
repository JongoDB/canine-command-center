# Build log

Running record of autonomous development — what's done, what's in flight, and
decisions made along the way. Newest first. (Per `docs/WORKING_AGREEMENT.md`.)

Status key: ✅ merged · 🚧 in flight · ⏳ pending · 🧪 awaiting your UI/UX checkpoint

---

## Phase 0 — Foundations

- ⏳ **M0.1 — Monorepo scaffold** — _in flight_ (branch `chore/m0.1-monorepo-scaffold`).
  pnpm workspaces; `apps/{api,web,mobile}` + `packages/{shared,ui}` + `infra/`;
  TypeScript (strict), ESLint 9 (flat config), Prettier, Vitest; root scripts
  (`dev:*`, `build`, `typecheck`, `lint`, `test`, `format`, `db:*`); PR template;
  this build log. `packages/shared` seeded with branding constants; `packages/ui`
  seeded with the design tokens from `docs/DESIGN.md`. App packages are stubs
  (real builds land in M0.3 / M0.6).
- ⏳ **M0.2 — CI + branch protection**
- ⏳ **M0.3 — API skeleton + DB**
- ⏳ **M0.4 — Auth**
- ⏳ **M0.5 — Shared package v1** (started in M0.1; extended alongside M0.3/M0.4)
- ⏳ **M0.6 — Client skeletons (mobile + web)**

## Decisions

- **2026-05-11** — Stack confirmed by owner ("you choose" → as in `docs/ARCHITECTURE.md`):
  pnpm monorepo, Fastify+Postgres+Drizzle+Better-Auth API, Expo mobile, Vite/React
  PWA web, shared TS core. Owner gave the go and signed off on the humane-first
  training stance + the gated opt-in Protection/Bite-Sport track.
- **2026-05-11** — npm scope `@ccc/*` for workspace packages (`@ccc/api`,
  `@ccc/web`, `@ccc/mobile`, `@ccc/shared`, `@ccc/ui`); never published (`private`).
- **2026-05-11** — `.npmrc` `node-linker=hoisted` for Metro/Expo compatibility
  with pnpm (standard for RN + pnpm monorepos).
- **2026-05-11** — TS base config: `module: ESNext` + `moduleResolution: Bundler`
  - `verbatimModuleSyntax` (avoids the NodeNext `.js`-extension friction); the API
    runs via `tsx` in dev and is bundled with `tsup` for prod; `packages/shared` &
    `packages/ui` are consumed as TypeScript source (`main` → `src/index.ts`), so no
    build step — their bundler/compiler does it.

## Open items / deferrals

- (none yet)

# Build log

Running record of autonomous development — what's done, what's in flight, and
decisions made along the way. Newest first. (Per `docs/WORKING_AGREEMENT.md`.)

Status key: ✅ merged · 🚧 in flight · ⏳ pending · 🧪 awaiting your UI/UX checkpoint

---

## Phase 0 — Foundations ✅ **complete**

- ✅ **M0.6b — Mobile client skeleton (Expo) + `@ccc/ui` primitives** — PR #14,
  merged. `apps/mobile`: Expo SDK 55 + Expo Router (`app/_layout.tsx` does the
  session-gate redirect), React 19 / RN 0.83; `@better-auth/expo` client +
  `expo-secure-store` (cookie-less mobile sessions, token in the keychain) +
  `@ccc/shared` `ApiClient`; auth screens — sign in / sign up / forgot-password —
  and an empty authenticated `/` (app shell + API-health pill + sign-out); the
  dark "K9" theme via `@ccc/ui` tokens; RN UI helpers in `src/components/ui.tsx`;
  monorepo `metro.config.js` (watch the workspace, resolve hoisted deps);
  `app.json` (scheme `caninecommandcenter`, typed routes), `babel.config.js`,
  `expo-env.d.ts`. `@ccc/ui` gained `styles.ts` — a small set of shared,
  framework-agnostic style objects derived from the tokens (the seed of the
  cross-platform primitive layer; full components come with the real screens in
  Phase 1). Bumped `apps/web` to **React 19** to align with mobile (Expo 55
  requires React 19) — kept the web gate green. Renamed the mobile `prebuild`
  script → `native:prebuild` (the npm `prebuild` lifecycle hook was making
  `pnpm build` run `expo prebuild`); added `expo-network` (a peer dep of the
  Better Auth Expo plugin); extended `.gitignore` for the Expo-generated
  `ios/`/`android/`. Verified: full gate green; `expo export --platform android`
  bundles the whole app (entry → Expo Router → auth client → screens → `@ccc/*`)
  to a 3.7 MB Hermes bundle. _(Can't device-test here — UI/UX Checkpoint 1, end
  of Phase 1, is the real test of both clients.)_ Known follow-ups (Phase 1+):
  mobile email-link verification/reset deep links (currently route via the web
  app), forwarding the stored session token on authed API calls
  (`authClient.getCookie()` in `api.ts` `headers`), loading the webfonts via
  `expo-font`, push, app icon/splash.
- ✅ **M0.6a — Web client skeleton** — PR #13, merged. `apps/web`: Vite 6 +
  React 18 (later → 19 in M0.6b) + React Router 6; static PWA manifest; the
  Better Auth browser client (cookie sessions) + the `@ccc/shared` `ApiClient`;
  auth screens — sign up / sign in / `/verify-email` (the email-link landing
  page; hands the token to the API and lands the user back home auto-signed-in) /
  forgot + reset password; an empty authenticated `/` (app shell + an API-health
  pill + sign-out); the dark "K9 field journal" theme (mirrors `@ccc/ui` tokens).
  Dev proxy (`/api`, `/health`, `/me` → the Fastify server) so it's same-origin
  (no CORS, the cookie works). Touched `apps/api`: added `WEB_BASE_URL` so
  verification/reset emails link to the web app, not the API. Removed the unused
  `declaration`/`declarationMap` from `tsconfig.base.json` (fixed TS2742 on the
  Better Auth client). Verified: full gate green; built bundle ~66 KB gz JS; dev
  server + API + proxy + mailpit smoke-tested end to end.
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

## Phase 1 — MVP: the dog + Scout 🚧 _in progress_

- 🚧 **M1.4b — Mobile Scout chat UI** — _in flight_ (branch `feat/m1.4b-mobile-scout-chat`).
  `apps/mobile`: `app/scout/index.tsx` (conversation list + new-chat),
  `app/scout/[id].tsx` (the chat — bubbles, suggested prompts when empty, send
  box, optimistic user bubble, anchored-dog pill), `src/lib/conversations.ts`
  (API wrappers + `sendMessage()` — POSTs to the SSE endpoint and consumes the
  **whole** response body via `fetch().text()`, parsing every `data:` frame for
  the persisted message turns; **non-streaming** for v1 — live token-by-token
  on mobile via XHR `onprogress` is a follow-up). `app/dogs/[id].tsx` gained a
  "Talk to {Scout} about <name>" button → `POST /v1/conversations { dogId }` →
  `/scout/[id]`. Full gate green; mobile `tsc` clean. _(After this: tag `0.1.0`
  — Phase 1 done. Follow-ups: live mobile streaming; mobile photo picker
  (`expo-image-picker`); the rich B–E intake on mobile.)_
- ✅ **M1.1d — Media / photos (backend + web)** — PR #23, merged. `apps/api`:
  generic `media` table (+ `media_kind` enum) + `dog.photoMediaId` fk + migration
  `0004_media.sql`; `src/services/storage.ts` (`StorageProvider` +
  `LocalFsStorageProvider` → `${UPLOADS_DIR}`); `routes/media.ts` —
  `POST /media` (multipart image upload, ≤10 MiB, `image/*` only, owner-scoped)
  - `GET /media/:id` (streams), both `requireSession`; `media.test.ts` (28 API
    tests now). `@ccc/shared` + `media.ts`; `dog.ts` `photoMediaId`. `apps/web`:
    `lib/media.ts`, photo input + preview in intake Section A (reused by EditDog),
    photo on the dog profile. EXIF/thumbnails (sharp) + mobile photo picker are
    follow-ups.
    `apps/api`: generic `media` table (+ `media_kind` enum) + `dog.photoMediaId`
    fk + migration `0004_media.sql`; `src/services/storage.ts` (`StorageProvider`
    interface + `LocalFsStorageProvider` → `${UPLOADS_DIR}`, default `./uploads`);
    `routes/media.ts` — `POST /media` (multipart image upload via
    `@fastify/multipart`, ≤10 MiB, `image/*` only) + `GET /media/:id` (streams the
    file), both `requireSession` + owner-scoped; `media.test.ts` (upload a 1×1 PNG,
    serve it back, owner-scoping → 404 for another user, 401 unauth, non-image →
    415). `@ccc/shared`: + `media.ts` (`Media`); `dog.ts` gains `photoMediaId` on
    `DogProfileInput` + the `Dog` interface; the dog routes carry it. `apps/web`:
    `lib/media.ts` (`uploadPhoto`, `mediaUrl`), a photo file-input + preview in
    Section A of the intake form, the photo shown on the dog profile. 28 API tests
    pass against Postgres. _(Mobile photo — `expo-image-picker` upload — is a small
    follow-up.)_
- ✅ **M1.5 — Onboarding glue (web)** — PR #21, merged; web app is at UI/UX
  Checkpoint 1 (first-run sign-up → /onboard → intake → "meet Scout" → /scout/:id;
  /settings with delete-account via Better Auth `user.deleteUser`). `apps/web`: a brand-new owner now flows
  **sign up → (Home detects zero dogs → redirects to) `/onboard` → intake → "meet
  Scout"** (lands straight in `/scout/:id`, a conversation anchored to the new
  dog with suggested prompts ready). New **`/settings`** screen (profile read-
  only, notifications stub, sign out, **delete account** — `apps/api` enabled
  Better Auth's `user.deleteUser`, so the row + all FK-cascaded data goes).
  `Home`'s email link now opens `/settings`. → **🧪 UI/UX Checkpoint 1**: the
  owner runs intake (default + a custom breed/age), chats with Scout, pokes the
  unsafe prompts; this is also where we reconcile the interface reference. _(The
  mobile chat — M1.4b — and photos — M1.1d — are the remaining Phase-1 items;
  the `0.1.0` tag lands once mobile chat is in.)_
- ✅ **M1.4a — Web Scout chat UI** — PR #20, merged. `apps/web`: `/scout`
  (conversation list + new-chat) and `/scout/:id` (the chat — streamed text,
  anchored-dog pill, suggested prompts when empty, send box, optimistic
  user-message bubble, Stop while streaming, tool-use caption on the assistant
  bubble). `lib/conversations.ts` (typed wrappers + `streamScout()` — fetches the
  SSE endpoint and parses `data:` frames into `ChatEvent`s via the
  `ReadableStream`). `DogProfile` gained a **"Talk to Scout about <name>"**
  button (`POST /v1/conversations { dogId }` → `/scout/:id`, opening
  already-anchored); `Home` gained an "Open Scout chats →" link.
- ✅ **M1.3 — Claude (Scout) integration** — PR #19, merged. `apps/api`: + `@anthropic-ai/sdk`; `conversation` +
  `message` tables (with the `message_role` enum) + migration
  `0003_conversation_message.sql`. `src/ai/`: **`persona.ts`** assembles the
  6-block system prompt from `docs/AI.md` (identity → expertise → 14 knowledge
  modules → safety rules → tool guidance → output style → per-conversation
  context); **`knowledge.ts`** = the 14 lean module summaries (M5.3 expands
  them); **`tools.ts`** = the read-tool registry (`list_dogs`,
  `get_dog_profile`, `get_breed_info`) — Zod-validated input, owner-scoped DB
  lookups, errors return strings the model recovers from; **`context.ts`** =
  per-conversation context builder (anchored dog + the matching `breed_profile`
  entry + the latest intake answers + the brief catalogue of the owner's other
  dogs); **`llm.ts`** = the Anthropic streaming wrapper — OAuth-token preferred
  / API-key fallback, `cache_control: ephemeral` on the system block plus
  top-level (so the cached prefix grows turn by turn), exposes a typed
  `LlmStreamFn` for DI; **`scout.ts`** = the orchestrator (persists the user
  message, runs the tool-use loop with a 6-iteration cap, persists each
  assistant turn with text + tool_calls + token usage, yields `ChatEvent`s).
  **`routes/chat.ts`**: `POST /v1/conversations`, `GET /v1/conversations`,
  `GET /v1/conversations/:id` (with messages), `DELETE /v1/conversations/:id`,
  and **`POST /v1/conversations/:id/messages`** as a real **SSE stream** — all
  `requireSession`-gated and owner-scoped; returns a clean **503
  `NO_LLM_CREDENTIALS`** when neither env var is set. **`chat.test.ts`**
  (DB-backed, with the LLM mocked via DI in `buildServer({ llm })` so CI
  doesn't burn tokens): unauthed → 401, single-turn text streams end-to-end +
  the persona system prompt + per-conversation context were assembled and the
  message rows persist, a tool-use round-trip (assistant → `list_dogs` →
  `tool_result` → text answer) wires through, the no-credentials path returns 503. **`scripts/ai-smoke.ts`** (manual: `pnpm ai:smoke`) hits the real
  Anthropic API. Also: `server.ts`'s DB-pool `onClose` hook is now skipped in
  tests so the suites can build/close many app instances against one shared
  pool. Verified: full gate green; **all 24 API tests pass against Postgres**
  (server 4 + auth 4 + dogs 6 + breeds 6 + chat 4).
- ✅ **M1.2 — Breed library v1** — PR #18, merged. `apps/api`: `breed_profile`
  `apps/api`: `breed_profile` table + the `breed_profile_kind`/`energy_level`/
  `trainability` pgEnums + migration `0002_breed_profile.sql`; **10 seeded
  breeds** in `src/data/breeds.ts` — Belgian Malinois, Dutch Shepherd, the
  composite **Mal × Dutch Shepherd**, German Shepherd, Border Collie, Australian
  Shepherd, Labrador, Golden, Standard Poodle, "Unknown mix" — with traits,
  energy, trainability, weight/height/lifespan ranges, grooming, health
  watch-list, daily exercise reality, and a notes paragraph; idempotent UPSERT
  via `src/db/seed.ts` invoked from `applyMigrations()` (so `pnpm db:migrate` /
  `pnpm db:check` end with a fully-seeded DB); `routes/breeds.ts` —
  `GET /breeds?search` (name + AKA via jsonb-text ILIKE) + `GET /breeds/:slug`,
  both `requireSession`-gated; `breeds.test.ts` (DB-backed: list, search by
  name + alias, get by slug, composite carries `parentSlugs`, 404, 401). All 20
  API tests pass against Postgres. `apps/web`: `/breeds` (list + debounced
  search) and `/breeds/:slug` (detail — bred-for, energy / trainability,
  size/lifespan ranges, temperament, parent breeds for composites, daily
  exercise reality, health watch-list, grooming, notes). Linked from the dog
  profile (`View breed profile →` for both pure and composite dogs) and from
  Home. `@ccc/shared` gains `breed.ts` (`BreedProfile`, `BreedProfileSummary`,
  `Range`, helpers). _(Mobile breed UI is a small follow-up.)_
- ✅ **M1.1c — Mobile intake UI + dog list/profile** — PR #17, merged. `apps/mobile`: home rewritten as a dog list
  (or empty-state CTA → `/onboard`), refreshing on focus; `app/onboard.tsx` — RN
  intake form (Section A / identity, in full; the richer B–E sections are on web
  for the skeleton — the data model supports them and the user can re-run intake
  there); `app/dogs/[id].tsx` profile (identity rows + intake payload + Edit /
  Archive); `app/dogs/[id]/edit.tsx` (Section A → `PATCH`). RN UI helpers:
  `src/components/intake-section-a.tsx` (Field/Toggle/OptionRow primitives + the
  Section A panel — no native picker dep, options are tappable pills), reused by
  Onboard + EditDog. `src/lib/dogs.ts` (typed wrappers around the `ApiClient`).
  `src/lib/api.ts` now forwards the stored session token via
  `authClient.getCookie()` for authed routes (the M1.1 follow-up). The Mal × Dutch
  Shepherd default + the empty profile moved into `@ccc/shared/dog.ts` so both
  clients share them. Verified: full gate green; `expo export --platform android`
  bundles the whole app (entry → Expo Router → home/onboard/dogs[id]/edit →
  IntakeSectionA → `@ccc/*`) to a 3.7 MB Hermes bundle. _(M1.1d adds
  media/photos to both clients.)_
- ✅ **M1.1b — Web intake UI + dog list/profile** — PR #16, merged. `apps/web`:
  a real **Home** (lists the user's dogs as cards or shows the empty-state CTA →
  `/onboard`); **`/onboard`** — the five-section intake stepper (A identity → B
  history → C living → D current → E goals; Belgian Malinois × Dutch Shepherd ×
  female × high-drive prefilled by default, "Start fresh" button; Next/Back
  navigation; on submit `POST /dogs` + `PUT /dogs/:id/intake`); **`/dogs/:id`**
  profile view (identity rows + the stored intake payload + Edit / Archive);
  **`/dogs/:id/edit`** (Section A only → `PATCH`). Hand-managed form state — no
  `react-hook-form`. Components in `src/components/intake/IntakeForm.tsx`;
  `src/lib/dogs.ts` typed wrappers. Web bundle ~105 KB gz.
- ✅ **M1.1a — Dog data model + API** — PR #15, merged. `apps/api`: `dog` +
  `intake_response` tables + the pgEnums (`breed_kind`, `dog_sex`,
  `neuter_status`, `dog_source`) + migration `0001_dog_intake.sql`; dogs routes
  — `GET/POST /dogs`, `GET/PATCH/DELETE /dogs/:id` (DELETE = soft-delete via
  `archived_at`), `GET /dogs/:id/intake` (latest version), `PUT /dogs/:id/intake`
  (new version, in a transaction, optionally patching the dog) — all
  `requireSession`-gated and scoped to the requester; Zod-validated via
  `src/lib/validate.ts` (`parsed()` → 400 `{ error: { code: 'VALIDATION', … } }`).
  `@ccc/shared` gained `dog.ts` — the Zod schemas (breed/sex/neuter/source enums,
  `IntakeAnswers` covering PRODUCT §4's sections B–E, `DogProfileInput`,
  `UpdateDogInput`, `SubmitIntakeInput`) + the `Dog`/`IntakeResponse` response
  types + `ageMonthsFrom`/`breedLabel` helpers (`zod` is now a `@ccc/shared`
  dep). `src/test-helpers.ts` (`createTestUser` via the real auth flow);
  `dogs.test.ts` — DB-backed: create the Mal × Dutch Shepherd default, list/
  get/patch/archive, ownership scoping (a 2nd user can't see/touch the first's
  dogs), intake versioning. 14 API tests pass against Postgres.
- ⏳ **M1.1d — Media / photos** (storage provider + upload route + photo display
  on both clients) · ⏳ M1.2 — Breed library v1 · ⏳ M1.3 — Claude (Scout)
  integration · ⏳ M1.4 — Scout chat UI · ⏳ M1.5 — onboarding glue → then
  **🧪 UI/UX Checkpoint 1** (deploy to staging; first owner hands-on review of
  both clients + the Scout persona).

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
- **2026-05-11 (M0.6b)** — React aligned to **19** monorepo-wide (Expo SDK 55
  requires it; web was on 18 — bumped to 19, gate stayed green). Don't name a
  workspace script `prebuild`/`pretest`/etc. — npm/pnpm run those as lifecycle
  hooks for `build`/`test` (the mobile `expo prebuild` script is now
  `native:prebuild`). Expo plugins can pull optional deps via dynamic `import()`
  that Metro still needs to resolve — `@better-auth/expo` needs `expo-network`.

## Open items / deferrals

- **GitHub Actions on Node 20** — `actions/checkout@v4`, `actions/setup-node@v4`,
  `pnpm/action-setup@v4` log a deprecation warning (Node 20 → forced Node 24 from
  2026-06-02). Non-blocking; Dependabot (github-actions ecosystem) will bump them,
  or bump manually before then.
- **`pnpm audit`** reports a few _moderate_ transitive advisories — surfaced by
  the advisory `audit` CI job; Dependabot will chip at them. No high/critical open.
- **M0.5 calculators** (calorie/portion, age-stage, vaccine-schedule) — deferred
  to the milestones that actually use them (M4.1 / M3.x) rather than stubbing now.
- **Mobile follow-ups** (Phase 1+): email-link verification/reset deep links
  (currently route through the web app); forward the stored session token on
  authed API calls (`authClient.getCookie()` in `apps/mobile/src/lib/api.ts`);
  load the Bebas/DM Sans/Space Mono webfonts via `expo-font`; push notifications;
  app icon + splash.
- **Cross-platform `@ccc/ui` component primitives** — only the tokens + a few
  shared style objects exist; the real components (Badge, ScreenHeader,
  TimelinePhase, CommandCard, …) build out alongside the real screens in Phase 1.

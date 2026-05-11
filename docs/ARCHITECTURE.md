# Architecture — Canine Command Center

You asked me to choose the stack and to target **both** mobile and web with a
shared core. Here's the choice and the reasoning.

## 1. Shape: a TypeScript monorepo

```
canine-command-center/
├─ apps/
│  ├─ api/        Fastify + Postgres + Drizzle ORM + Better Auth; the only
│  │              thing that holds secrets or talks to Claude.
│  ├─ mobile/     Expo (React Native) — iOS + Android. Expo Router.
│  └─ web/        Vite + React + React Router — responsive web app (PWA‑capable).
├─ packages/
│  ├─ shared/     Framework‑agnostic TS: domain types, Zod schemas, the API
│  │              client, branding constants, curriculum/skill data shapes,
│  │              calculators (calorie/portion, age‑stage, vaccine schedule).
│  └─ ui/         (added in Phase 1) Shared design tokens + a thin set of
│                 cross‑platform primitives so mobile & web look like siblings.
├─ docs/          ← you are here
└─ infra/         docker‑compose, Caddy/Tailscale config, deploy scripts.
```

- **Package manager:** `pnpm` workspaces (fast, strict, great monorepo story).
- **Node:** 22 LTS (pinned via `.nvmrc`; engines field enforces it).
- **Language:** TypeScript everywhere, `strict` on. Shared types are the
  contract between API and both clients — no drift.
- **Why a monorepo:** "both platforms, shared core" basically *requires* it —
  one source of truth for domain logic, schemas, and the API client; one CI;
  atomic changes across API + clients.

> This deliberately mirrors the proven structure of the existing `~/plant-app`
> project (Expo + Fastify + Postgres + Claude OAuth proxy). Reusing a layout
> that already works end‑to‑end de‑risks the build a lot. Web client is the
> net‑new piece here.

## 2. Backend — `apps/api`

- **Fastify** (TypeScript) — fast, schema‑first, great plugin ecosystem.
- **Postgres** via **Drizzle ORM** — typed schema + typed queries + first‑class
  migrations (`drizzle-kit`). Postgres because we want relations, JSONB for
  flexible bits (curriculum trees, intake answers), and it scales from a laptop
  Docker container to managed cloud unchanged.
- **Auth:** **Better Auth** — email/password to start (email verification,
  password reset), session cookies for web, bearer tokens for mobile; OAuth
  providers (Google/Apple "sign in with") addable later. Every data route is
  scoped to the authenticated user; multi‑user‑per‑dog sharing comes in Phase 5
  via a `dog_members` join table.
- **AI proxy:** the API is the *only* component that talks to Claude. It exposes
  an **SSE streaming** endpoint (`POST /v1/chat/:conversationId/messages`) that
  runs the tool‑use loop server‑side and streams text/tool events to the client.
  Auth to Anthropic prefers the **OAuth token from `claude setup-token`**
  (`Authorization: Bearer …`, billed to your Claude subscription) and falls back
  to `ANTHROPIC_API_KEY` (`x-api-key`) — mutually exclusive on the wire; the
  client never sees either. (Pattern lifted from `plant-app/apps/api/src/services/ai/llm/anthropicLlm.ts`.)
- **Background jobs:** an in‑process scheduler for v1 (reminder evaluation,
  digest generation) — cron‑like, idempotent, runs every N minutes; if it ever
  needs to scale out we move it to a real queue (BullMQ/Redis). No premature
  Redis.
- **File storage:** photos/video → pluggable storage provider. Local filesystem
  (Docker volume) for self‑host/dev; S3‑compatible (R2/B2/S3) for cloud. Thumbnails
  generated on upload. Signed URLs for access.
- **Notifications:** Expo Push (free) for mobile, Web Push for the PWA, and
  transactional email via SMTP / Resend (free tier) for verification, password
  reset, and opt‑in digests.
- **Other providers, behind interfaces (stub → real):** weather (Open‑Meteo,
  free — informs walk timing & heat‑safety warnings), and a slot for breed/health
  reference enrichment.

### Why not "just Supabase" or a serverless BaaS?

Considered it. We're running a **server‑side Claude tool‑use loop with streaming**
and **scheduled jobs** — that wants a real long‑lived process, not edge functions
with timeouts. A small Fastify service in Docker is simpler to reason about,
trivially self‑hostable (you may want that), and has no per‑seat pricing. Postgres
is still Postgres; if you'd rather point at managed Postgres (Supabase/Neon/RDS)
later, that's a connection‑string change.

## 3. Clients

### `apps/mobile` — Expo / React Native

- **Expo (managed) + Expo Router** (file‑based nav, deep links), EAS for builds
  & OTA updates. iOS + Android from one codebase.
- **State/data:** TanStack Query over the shared API client; light global state
  with Zustand. Local cache so the app is usable with flaky signal (a walk!).
- **Native bits:** camera/photo picker, push notifications, local notifications,
  optional on‑device STT/TTS for hands‑free coaching (Phase 5), haptics, secure
  store for the session token.
- **Why Expo:** fastest path to two real app stores, OTA updates, a huge module
  ecosystem, and it's the same engine `plant-app` already uses successfully.

### `apps/web` — Vite + React

- **Vite + React + React Router**, TanStack Query + Zustand (same data layer as
  mobile via `packages/shared`). Installable **PWA** (manifest + service worker)
  so it's "appish" on desktop and Android without a store. SSR not needed for v1
  (it's an authed app, not a content site).
- **Why a separate web app, not React‑Native‑Web:** RN‑Web is a tax (styling
  quirks, build complexity) for a project that wants a genuinely good desktop
  layout. Sharing the *logic* (types, schemas, API client, calculators, even
  domain hooks) in `packages/shared` gives us 80% of the DRY benefit with far
  less friction. `packages/ui` carries shared design tokens + a few primitives
  so the two clients stay visually consistent.

### Shared design system

`packages/ui` exports design tokens (color, spacing, type scale, radii, the calm
"chat‑first" aesthetic) and a thin primitive layer; mobile renders them with RN
components, web with HTML/CSS. One source of truth for "what the app looks like."

## 4. Data model (high level — full schema lands in Phase 0/1)

Core entities (all user‑scoped unless noted):

- `user`, `session`, `account` *(Better Auth)*; later `dog_member` (user↔dog, role).
- `dog` — the profile from intake (identity, origin/history, life situation,
  vet/insurance contacts, photos). `intake_response` — raw answers (JSONB),
  versioned.
- `breed_profile` *(reference, not user‑scoped)* — traits, energy, trainability,
  size/weight ranges, lifespan, grooming needs, health predispositions, "bred
  for"; supports composites (e.g. Malinois × Dutch Shepherd) and "unknown mix".
- `program` (1 per dog, regeneratable) → `program_phase` (life‑stage) →
  `program_module` → `program_task` (dated/age‑targeted, status, links to a
  `skill`). Curriculum trees also stored as JSONB snapshots for fast render +
  history.
- `skill` *(reference + user overrides)* — obedience/trick building blocks: cue,
  shaping steps, fluency tests, prereqs, troubleshooting, difficulty, tags.
- `training_session` — date, skill(s), duration, reps, success rating, mood,
  notes, media. Drives progress charts and Scout's history awareness.
- `health_event` — polymorphic: vet visit, exam finding, diagnosis, vaccination,
  parasite screen, bloodwork/imaging note, weight, body‑condition score, dental,
  spay/neuter, allergy, emergency. `medication` — name, dose, route, frequency,
  start/end, refills, adherence log.
- `diet_plan` — food profile, portions, schedule, treat budget, allergies,
  transition plan, weight goal. `meal_log`.
- `grooming_log`, `activity_log` (walks/runs/sport/etc. with duration, distance,
  intensity), `toy` (inventory + category + durability + rotation), `socialization_item`
  (checklist item + status + log), `potty_log`.
- `reminder` — what, when, recurrence, source (auto from a schedule rule, or
  user/Scout‑created), snooze, completion.
- `milestone` — birthdays, gotcha day, phase graduations, "firsts".
- `conversation` (optionally anchored to a dog and/or topic) → `message`
  (role, content blocks incl. text/image/tool_use/tool_result, token usage).
- `media` — photos/video, owner, thumbnails, EXIF stripped, links to whatever
  entity they're attached to.
- `audit_log` — who changed what (light, for trust/debug).

JSONB is used where the shape is genuinely flexible (intake answers, curriculum
snapshots, health‑event details, breed traits); everything queried/filtered/
joined regularly is a real column.

## 5. API surface (sketch — versioned under `/v1`)

`auth/*` (Better Auth) · `dogs` CRUD + `dogs/:id/intake` · `breeds` (search/get) ·
`dogs/:id/program` (get/regenerate) + `program/tasks/:id` (update/complete/reschedule) ·
`skills` (search/get) · `dogs/:id/training-sessions` CRUD + progress summary ·
`dogs/:id/health` (events CRUD) + `dogs/:id/medications` + `dogs/:id/health/summary` ·
`dogs/:id/diet` + `dogs/:id/meals` · `dogs/:id/grooming` · `dogs/:id/activities` ·
`dogs/:id/toys` · `dogs/:id/socialization` · `dogs/:id/potty` ·
`dogs/:id/reminders` + `reminders/due` · `dogs/:id/milestones` ·
`conversations` CRUD + `conversations/:id/messages` (**SSE stream**) ·
`media` (upload/get) · `me` (profile/settings/notification prefs) · `health` (liveness).

Everything request/response is a Zod schema in `packages/shared`; Fastify
validates against it; the clients import the same types. Pagination is
cursor‑based. Errors are a consistent `{ error: { code, message, details? } }`.

## 6. AI integration boundary

See `docs/AI.md` for the full design. Architecturally: the API owns the persona/
system prompt, the tool registry (each tool is a typed handler against the DB),
the per‑conversation **context builder** (assembles the dog profile + breed
traits + recent history + due reminders into a cached prefix block — pattern
from `plant-app/apps/api/src/rooti/context.ts`), the tool‑use loop, streaming,
persistence, prompt caching, and cost/rate limiting. Clients just render a stream.

## 7. Environments & deployment

- **Local/dev:** `docker compose up` → Postgres (+ optional mailpit, minio).
  `pnpm dev:api`, `pnpm dev:web`, `pnpm dev:mobile`. Seeded breed library &
  skill catalog. A `.env.example` documents every var.
- **Staging:** same compose stack on a small box (or Fly.io/Render), separate DB,
  separate Anthropic auth, used for the UI/UX checkpoints.
- **Production (self‑host path — likely your preference):** Docker Compose +
  **Caddy** (automatic TLS) + optional **Tailscale** for private access; nightly
  `pg_dump` backups to object storage; this mirrors how `plant-app` is set up.
  **Production (cloud path):** API on Fly.io/Render, managed Postgres
  (Neon/Supabase/RDS), object storage on R2/S3, same image. Pick one in Phase 6;
  the app doesn't care.
- **Mobile distribution:** EAS Build → TestFlight (iOS) + Play internal testing
  → store submission. **Web:** static build behind Caddy / on a static host +
  the API.

## 8. Quality gates (enforced in CI from Phase 0)

`pnpm typecheck` (all packages, strict) · `pnpm lint` (ESLint) ·
`pnpm format:check` (Prettier) · `pnpm test` (Vitest unit + integration; web E2E
via Playwright, mobile E2E via Maestro from Phase 2) · `pnpm build` (all apps) ·
`pnpm db:check` (migrations apply cleanly on a fresh DB) · dependency audit.
Branch protection on `main`: green CI required to merge. Details in
`docs/WORKING_AGREEMENT.md`.

## 9. Key decisions, restated for sign‑off

| Decision | Choice | If you'd rather… |
| --- | --- | --- |
| Monorepo + pnpm | Yes | (no real alternative for "shared core, 2 clients") |
| Backend | Fastify + Postgres + Drizzle + Better Auth, self‑hostable Docker | "use managed BaaS / Supabase functions" — say so, but I'd push back |
| Mobile | Expo / React Native | "bare RN" / "native Swift+Kotlin" — much slower, not worth it for v1 |
| Web | Vite + React (PWA), shares logic not RN‑Web | "use React‑Native‑Web for one codebase" — possible, I think it's a net loss |
| Claude auth | `claude setup-token` OAuth, API‑key fallback | (this is your stated requirement) |
| Hosting | Self‑host Docker primary, cloud path documented | "cloud‑first" — easy switch in Phase 6 |
| License | unset (TBD) | tell me MIT / Apache‑2.0 / proprietary |

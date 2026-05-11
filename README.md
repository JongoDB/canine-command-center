# Canine Command Center

> **Status: building — Phase 0 (Foundations).** The plan in `docs/` is approved
> and autonomous development is underway: one PR per roadmap milestone, merging
> after CI passes; the running record is in [`docs/BUILDLOG.md`](docs/BUILDLOG.md).
> The next time the owner is pulled in is **UI/UX Checkpoint 1** at the end of
> Phase 1. — _Code‑level slug: `canine-command-center`; npm scope `@ccc/_`. The
on‑screen app name and the AI assistant's name ("Scout") are placeholders, each
changeable in one constant — `packages/shared/src/branding.ts`.\*

An **AI‑first companion app for raising a dog** — training across months and
years, tricks, health & vet records, diet & nutrition, checkups, medications,
dental & coat care, humane behavior work, obedience, potty training,
socialization, leash manners, exercise & enrichment, toys, and more. You do a
short **intake** (we ship a tuned default for a **Belgian Malinois × Dutch
Shepherd mix**, but any breed / age / history works), and the app builds a
**tailored, breed‑aware curriculum** that spans your dog's life. Claude is on the
backend as **Scout** — an always‑available, expert dog‑raising assistant you talk
to in an in‑app chat, preprompted with a careful persona, domain skills, and
tools so it actually _knows_ your dog and gives grounded, safe advice.

## How to read this repo

| Doc                                                      | What's in it                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/PRODUCT.md`](docs/PRODUCT.md)                     | Vision, target user, every domain the app covers, the intake flow, the breed‑tailored curriculum concept, and the default Mal × Dutch Shepherd profile.                                                                                                                                                       |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)           | Tech stack & why (cross‑platform: shared TS core + mobile + web), data model, API surface, auth, storage, deployment, self‑host story.                                                                                                                                                                        |
| [`docs/DESIGN.md`](docs/DESIGN.md)                       | The visual language, derived from your interface reference (the "K9 Training Roadmap" artifact, saved in `docs/design/reference/`): the tactical working‑dog aesthetic, color/type tokens, the component kit, the four training tracks, how it maps to every screen, and the protection‑sport reconciliation. |
| [`docs/AI.md`](docs/AI.md)                               | Claude integration: persona & system prompt, the "skills" (knowledge domains), tool / function definitions, per‑conversation context injection, **safety guardrails** (vet deference, humane‑training stance, emergency handling), model selection, prompt caching, cost controls.                            |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)                     | The journey: Phase 0 → 6, every milestone, acceptance criteria, the testing/validation/versioning approach, and risks. Each milestone is one PR.                                                                                                                                                              |
| [`docs/WORKING_AGREEMENT.md`](docs/WORKING_AGREEMENT.md) | How autonomous dev runs day‑to‑day, the PR/CI flow, the points where I pause for you (UI/UX testing + hard blockers), what I need _from_ you, and how you give feedback.                                                                                                                                      |

## Repo layout

```
apps/
  api/        Fastify + Postgres + Drizzle + Better Auth + the Claude (Scout) SSE proxy
  web/        Vite + React + React Router — installable PWA
  mobile/     Expo / React Native — iOS + Android
packages/
  shared/     Framework-agnostic TS: domain types, Zod schemas, the API client, branding, calculators
  ui/         Shared design tokens (docs/DESIGN.md) + cross-platform component primitives
infra/        Docker Compose (dev) and, later, production deploy config + runbook
docs/         The plan (read these first) — see the table above
```

(pnpm workspaces; Node 22; TypeScript strict; ESLint + Prettier; Vitest.)

## Development

```sh
nvm use                 # Node 22 (see .nvmrc)
pnpm install
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build   # the CI gate
pnpm dev:api            # API (from M0.3)
pnpm dev:web            # web client (from M0.6)
pnpm dev:mobile         # mobile client (from M0.6)
pnpm db:up              # Postgres via Docker Compose (from M0.3)
```

Each milestone PR uses the template in `.github/PULL_REQUEST_TEMPLATE.md`; the
CI gate (typecheck · lint · format · test · build · DB migrations) must be green
to merge. See [`docs/WORKING_AGREEMENT.md`](docs/WORKING_AGREEMENT.md).

## Status & what's next

Plan approved; autonomous dev underway — current state is in
[`docs/BUILDLOG.md`](docs/BUILDLOG.md). The owner is pulled in only for the
UI/UX checkpoints (next: end of Phase 1) and the hard blockers listed in
`docs/WORKING_AGREEMENT.md` → _"What only you can unblock"_ (Claude token ✅
received; the rest — push/email creds, Apple/Google accounts, hosting, Sentry,
legal review — aren't on the critical path until Phase 3/6).

## Repo & license

Public, under [`github.com/JongoDB`](https://github.com/JongoDB). License: **TBD**
(left unset on purpose — tell me MIT / Apache‑2.0 / proprietary and I'll add it).

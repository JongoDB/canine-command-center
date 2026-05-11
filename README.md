# Canine Command Center

> **Status: Planning.** No app code yet. This repo currently holds the product
> spec, architecture, AI design, and the full MVP → production roadmap. Read it,
> mark it up (issues / PR comments / edit the docs), then green‑light autonomous
> development. — *Working dir slug: `canine-command-center`. On‑screen app name
> and the AI assistant's name ("Scout") are placeholders, each changeable in one
> constant; see `docs/PRODUCT.md`.*

An **AI‑first companion app for raising a dog** — training across months and
years, tricks, health & vet records, diet & nutrition, checkups, medications,
dental & coat care, humane behavior work, obedience, potty training,
socialization, leash manners, exercise & enrichment, toys, and more. You do a
short **intake** (we ship a tuned default for a **Belgian Malinois × Dutch
Shepherd mix**, but any breed / age / history works), and the app builds a
**tailored, breed‑aware curriculum** that spans your dog's life. Claude is on the
backend as **Scout** — an always‑available, expert dog‑raising assistant you talk
to in an in‑app chat, preprompted with a careful persona, domain skills, and
tools so it actually *knows* your dog and gives grounded, safe advice.

## How to read this repo

| Doc | What's in it |
| --- | --- |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Vision, target user, every domain the app covers, the intake flow, the breed‑tailored curriculum concept, and the default Mal × Dutch Shepherd profile. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Tech stack & why (cross‑platform: shared TS core + mobile + web), data model, API surface, auth, storage, deployment, self‑host story. |
| [`docs/DESIGN.md`](docs/DESIGN.md) | The visual language, derived from your interface reference (the "K9 Training Roadmap" artifact, saved in `docs/design/reference/`): the tactical working‑dog aesthetic, color/type tokens, the component kit, the four training tracks, how it maps to every screen, and the protection‑sport reconciliation. |
| [`docs/AI.md`](docs/AI.md) | Claude integration: persona & system prompt, the "skills" (knowledge domains), tool / function definitions, per‑conversation context injection, **safety guardrails** (vet deference, humane‑training stance, emergency handling), model selection, prompt caching, cost controls. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | The journey: Phase 0 → 6, every milestone, acceptance criteria, the testing/validation/versioning approach, and risks. Each milestone is one PR. |
| [`docs/WORKING_AGREEMENT.md`](docs/WORKING_AGREEMENT.md) | How autonomous dev runs day‑to‑day, the PR/CI flow, the points where I pause for you (UI/UX testing + hard blockers), what I need *from* you, and how you give feedback. |

## What I need from you before the journey starts

1. **Read the roadmap** and edit/comment anything you want changed — especially
   the **"Boundaries & humane correction"** framing in `docs/PRODUCT.md`
   (I reinterpreted "healthy punishment" as modern force‑free / LIMA behavior
   work; that's a deliberate, ethics‑driven call I want you to sign off on),
   the app name, and the assistant name.
2. **The interface reference** — ✅ received (the "K9 Training Roadmap" artifact);
   it's saved in `docs/design/reference/` and the design language is written up in
   `docs/DESIGN.md`. One thing to confirm there: the **protection / bite‑sport
   track** reconciliation (it's in your artifact; I'm keeping it as an optional,
   opt‑in, professionally‑supervised track — `docs/DESIGN.md` §7).
3. A handful of credentials/accounts I literally cannot create — listed in
   `docs/WORKING_AGREEMENT.md` → *"What only you can unblock."* Most have free
   tiers; app‑store accounts are the only paid items and aren't needed until
   Phase 6.
4. A "go" — then I run Phase 0 onward, opening one PR per milestone, pausing at
   the marked UI/UX checkpoints.

## Repo

Public, under [`github.com/JongoDB`](https://github.com/JongoDB). License: **TBD**
(left unset on purpose — tell me MIT / Apache‑2.0 / proprietary and I'll add it).

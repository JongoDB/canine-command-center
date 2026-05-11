# Roadmap — Canine Command Center (MVP → production)

How to read this: **7 phases**, each a handful of **milestones**, each milestone
is **one PR** on a feature branch into `main` (see `docs/WORKING_AGREEMENT.md`).
Every milestone lists **acceptance criteria** — what has to be true for it to
merge. Phases end at a **UI/UX checkpoint** (🧪 = I stop and hand you something
to click). "Beyond v1" lists the backlog. Order can be reshuffled; tell me what
you want moved.

Legend: 🧪 = your UI/UX testing checkpoint · 🔒 = needs something only you can
provide (see WORKING_AGREEMENT → "What only you can unblock") · ⚙️ = infra.

The UI follows [`docs/DESIGN.md`](DESIGN.md) (the tactical "K9 Training Roadmap"
language from your reference artifact — dark theme, Bebas/DM Sans/Space Mono, the
timeline‑of‑command‑cards, four training tracks: Obedience · Socialization ·
Advanced · Protection [opt‑in, gated]). `packages/ui` carries the tokens from M0.6.

---

## Phase 0 — Foundations ⚙️
*Goal: a healthy, deployable skeleton with CI, so every later milestone lands on solid ground.*

- **M0.1 — Monorepo scaffold.** pnpm workspaces; `apps/api`, `apps/mobile`,
  `apps/web`, `packages/shared`, `packages/ui` (stub), `infra/`; TS strict
  everywhere; ESLint + Prettier + EditorConfig; `.nvmrc` (Node 22); root scripts
  (`dev:*`, `build`, `typecheck`, `lint`, `format`, `test`, `db:*`); README +
  `.env.example`.
  *Accept:* `pnpm install && pnpm typecheck && pnpm lint && pnpm build` all green
  on a clean checkout.
- **M0.2 — CI.** GitHub Actions: install → typecheck → lint → format:check →
  test → build, on every PR; branch protection on `main` (CI required). Dependabot
  / `pnpm audit` step.
  *Accept:* a trivial PR shows the full green check suite; `main` can't be pushed
  to directly.
- **M0.3 — API skeleton + DB.** Fastify server, env‑config module (validated),
  structured logging, `GET /health`; Docker Compose (Postgres + mailpit + minio
  for dev); Drizzle wired with the **first migration** (Better Auth tables +
  `user`); `pnpm db:up`, `pnpm db:migrate`, `pnpm db:check` (migrations apply on a
  fresh DB).
  *Accept:* `docker compose up` + `pnpm dev:api` → `/health` 200; migrations
  apply clean; CI runs DB tests against a throwaway Postgres.
- **M0.4 — Auth.** Better Auth: email/password sign‑up (with verification email
  via mailpit in dev), login, logout, password reset, session middleware
  (`requireSession`); web uses cookies, mobile uses bearer tokens; `me` route.
  *Accept:* integration tests cover sign‑up → verify → login → authed `me` →
  logout; unauthed access to a protected route → 401.
- **M0.5 — Shared package v1.** Domain types & Zod schemas for the entities we'll
  need first (user, dog, breed, conversation/message); the typed API client;
  `branding.ts` (app name + "Scout"); calculators stubbed.
  *Accept:* API imports schemas from `packages/shared`; type‑level contract test
  passes; clients can import it.
- **M0.6 — Client skeletons.** `apps/mobile`: Expo app boots (Expo Router),
  splash/icon placeholders, auth screens, hits `/health` & does the full auth
  flow, stores the token securely. `apps/web`: Vite+React app boots (React
  Router), PWA manifest, auth screens, same flow with cookies. `packages/ui`:
  design tokens + 3–4 shared primitives.
  *Accept:* both clients run locally, sign up / log in / log out against the API,
  show an empty authed home; `pnpm build` produces a web bundle and an Expo
  prebuild.

**Exit Phase 0:** green CI, one‑command local stack, working auth on both
clients, deployable image. *(No checkpoint — nothing to "feel" yet.)*

---

## Phase 1 — MVP: the dog + Scout (the core loop) 🔒🧪
*Goal: do intake for a dog, open chat, and Scout knows the dog + breed and coaches you — safely.*

- **M1.1 — Dog profile + intake.** `dog` schema/migration/CRUD; the full intake
  questionnaire (sections A–E from `docs/PRODUCT.md`) as a stepper on both
  clients, with **Belgian Malinois × Dutch Shepherd mix · female · high‑drive**
  prefilled as the example (matching the reference artifact); profile screen
  (view/edit); photo upload (local‑fs storage provider, thumbnails, EXIF
  stripped); multi‑dog support from the start.
  *Accept:* create/edit a dog via UI on mobile + web; intake answers persist
  (versioned); photos upload & render; switching between dogs works; API tests
  cover CRUD + authz scoping.
- **M1.2 — Breed library v1.** `breed_profile` schema/migration + seed: a curated
  starter set (popular breeds + working breeds + "unknown mix" + the **Malinois ×
  Dutch Shepherd composite**) with traits, energy, trainability, size/weight
  ranges, lifespan, grooming, health predispositions, "bred for"; `breeds`
  search/get API; a breed‑detail screen; intake links the dog to a breed profile
  (or "mix of …").
  *Accept:* search a breed, see its profile; the default dog shows the composite
  profile; data sourced from the `knowledge/` modules so it's consistent with
  what Scout knows.
- **M1.3 — Claude integration (server) 🔒.** Anthropic SDK wired in `apps/api`;
  **OAuth via `claude setup-token`** (env `ANTHROPIC_AUTH_TOKEN`) with
  `ANTHROPIC_API_KEY` fallback *(you generate the token — see WORKING_AGREEMENT)*;
  persona system prompt v1 (all 6 blocks, all 14 knowledge modules) under
  `apps/api/src/ai/`; per‑conversation context builder (anchored dog + breed +
  household + all‑dogs catalogue); `conversation`/`message` schema; SSE streaming
  endpoint; the server‑side tool‑use loop with the **read tools** wired
  (`list_dogs`, `get_dog_profile`, `get_breed_info`); prompt caching
  (system‑block + auto top‑level breakpoint); graceful offline handling; basic
  per‑user rate limit; an internal "ai smoke test" script.
  *Accept:* a curl/integration test streams a real Scout reply that correctly
  uses the dog's profile + breed; safety rails fire on the canned unsafe prompts;
  Claude‑down is handled without 500s; prompt‑cache hits show in logs.
- **M1.4 — Scout chat UI.** Chat screen on mobile + web: streaming text, tool‑use
  indicators ("Scout is checking the breed profile…"), conversation list,
  rename, anchoring (open Scout from a dog → pre‑anchored), seeded suggested
  prompts, message persistence, empty/loading/error/offline states, a clear
  emergency banner when Scout flags one, copy/share a message.
  *Accept:* full back‑and‑forth chat works on both clients with live streaming;
  anchoring carries context; refresh restores history; the unsafe‑prompt
  responses look right in the UI.
- **M1.5 — Onboarding glue.** First‑run flow: sign up → intake → "meet Scout"
  (a seeded first conversation referencing the new dog) → land on a minimal
  "Today" home (placeholder until Phase 2/3 fill it). Settings: profile,
  notification prefs (stub), sign out, delete account/data.
  *Accept:* a brand‑new user goes from nothing to chatting with a
  Scout‑who‑knows‑their‑dog in one smooth flow on both clients.

**🧪 Checkpoint 1 — "Does talking to Scout feel good and *informed*?"** I deploy
to staging; you run intake (try the default *and* a custom breed/age), chat with
Scout about training/health/diet/the working‑breed stuff, poke the unsafe
prompts, and tell me where the persona, the context awareness, or the UI is off.
This is also where we **reconcile the interface reference** (your artifact/PDF)
into the design.

---

## Phase 2 — Curriculum / Program engine (the differentiator) 🧪
*Goal: intake → a real, breed‑ and age‑aware, multi‑month/year training program you can follow and log against.*

- **M2.1 — Program data model.** `program` / `program_phase` / `program_module` /
  `program_task` schema/migrations + JSONB snapshots; every module/task carries a
  **track** (Obedience · Socialization · Advanced · Protection) and a state
  (locked → working → fluent); CRUD + reorder/reschedule/complete APIs; status &
  progress rollups (overall and per‑track).
  *Accept:* a program tree can be created, edited, reordered, track‑filtered, and
  progress‑rolled up (overall + per track); API tests cover it.
- **M2.2 — Skill & trick catalog v1.** `skill` schema/migration + seed from the
  `knowledge/` modules: name recognition, marker charging, sit, down, stand,
  stay/wait, recall, heel/loose‑leash, place/mat/settle, leave‑it, drop‑it,
  crate, "go to bed", impulse‑control games, default behaviors + a starter trick
  set (shake, spin, roll over, bow, speak/quiet, leg weaves, tidy toys) — each
  with cue, lure→shape→capture steps, fluency tests, prereqs, difficulty,
  troubleshooting; skill‑detail screen.
  *Accept:* browse the catalog; open a skill and see its full shaping plan;
  prereq graph is sane; content matches what Scout cites.
- **M2.3 — Curriculum generation.** `generate_program(dogId)` /
  `adjust_program(dogId, …)` tools: Scout builds a tailored plan from intake +
  current state — **age‑staged** (socialization window vs. adolescence vs. adult,
  computed from DOB/estimate), **breed‑weighted** (working‑breed → impulse
  control / drive outlets / decompression emphasis), **goal‑weighted** (pet home
  vs. nosework prospect vs. off‑leash reliability), with the first 1–2 weeks
  fully fleshed and later phases as expandable scaffolding; deterministic
  validation that the output is well‑formed and humane‑first before it's saved;
  re‑generation preserves logged history.
  *Accept:* the default Mal × Dutch intake produces a coherent, sensibly
  sequenced multi‑phase program; a custom "10‑yr‑old couch Lab" intake produces a
  very different, equally sensible one; "make it less intense" via chat visibly
  adjusts it; regeneration doesn't nuke logs.
- **M2.4 — Program UI.** The **timeline‑of‑command‑cards** screen from
  `docs/DESIGN.md` — vertical phases with age markers, track‑grouped `CommandCard`s
  (colored per track), per‑phase Scout‑authored `TrainerNote`, the Protection
  track's standing `WarningNote`; card detail (the shaping plan inline, state,
  "log a rep"); complete / skip / reschedule; phase progress & graduations;
  per‑track filter; "ask Scout to adjust this phase" deep‑link; "this week" /
  "today's tasks" feeding the Today home. Built on `packages/ui` tokens; matches
  on mobile + web.
  *Accept:* the default dog's generated program renders as the artifact‑style
  timeline on both clients; a user can work today's cards, mark them done,
  reschedule, filter by track, and watch progress (overall + per track) move.
- **M2.5 — Training session logging.** `training_session` schema/migration; log a
  session (skill[s], duration, reps, success rating, mood, notes, optional
  photo/video) from a task, from the dog, or from chat (`log_training_session`
  tool); `get_training_history` tool; progress charts (success trend per skill,
  sessions/week, streaks); Scout references real history in chat.
  *Accept:* log sessions three ways; charts render; "how's our recall going?"
  gets a grounded answer citing the logs; history survives program regeneration.

**🧪 Checkpoint 2 — "Is the program actually good, and is it pleasant to follow?"**
You run intake for 2–3 very different dogs, read the generated curricula
critically (sequencing? realism? breed fit?), follow a few days of tasks, log
sessions, ask Scout to tweak the plan, and tell me what a real trainer would
change.

---

## Phase 3 — Health, vet & medications 🧪
*Goal: a complete health timeline, scheduled care, working reminders, and safe health coaching.*

- **M3.1 — Health records.** `health_event` (polymorphic) + `media` schema/
  migrations; log/edit vet visits, exam findings, diagnoses (as recorded by the
  vet, not by Scout), weight, body‑condition score, parasite screens, bloodwork/
  imaging notes, dental, spay/neuter, allergies, emergencies; health timeline UI;
  weight & BCS charts; `log_health_event` + `get_health_summary` tools.
  *Accept:* build a full health history via UI; charts render; Scout's
  health‑summary answers match the records; authz scoping tested.
- **M3.2 — Medications & preventives.** `medication` schema/migration; add a med
  (name, dose, route, frequency, start/end, refills, prescriber); flea/tick,
  heartworm, deworming, supplements as first‑class; adherence log
  (`log_medication_dose`); meds UI; `add_medication` tool.
  *Accept:* add meds & preventives, log doses, see adherence; Scout can list
  current meds but never invents a dose or prescribes.
- **M3.3 — Care schedules.** Rule‑driven schedules: puppy vaccine series, annual/
  semi‑annual wellness, senior panels, dental cleanings, parasite‑prevention
  cadence — computed from the dog's age/history/breed, surfaced as upcoming
  items; user can edit/dismiss.
  *Accept:* the default puppy shows a realistic puppy‑series + first‑year
  schedule; an adult shows annual cadence; a senior shows senior screenings; all
  editable.
- **M3.4 — Reminders engine ⚙️🔒.** `reminder` schema/migration; the in‑process
  scheduler evaluates schedule rules + user/Scout‑created reminders; delivery via
  in‑app, **Expo push** (mobile) + **Web Push** (PWA) + opt‑in **email** (SMTP/
  Resend) *(you provide push credentials & an email sender — see
  WORKING_AGREEMENT)*; snooze/complete; `create_reminder` / `list_due_reminders`
  / `complete_reminder` tools; notification‑prefs settings made real.
  *Accept:* a due/overdue reminder appears in‑app, fires a push on a real device,
  and (if opted in) an email; snooze & complete work; Scout can set/complete
  reminders for the user.
- **M3.5 — Health UI + Scout health flows.** Health dashboard (next vet visit,
  vaccines due, meds due, weight trend, open flags); the emergency‑triage flow
  (red‑flag detection → emergency banner + saved emergency‑vet contact + poison‑
  control numbers); "what should I ask at the next vet visit?" helper; symptom/
  observation logging from chat with strong "see your vet" framing.
  *Accept:* the dashboard is genuinely useful at a glance; the emergency flow
  triggers on the canned scenarios and is impossible to miss; symptom logging
  never reads as diagnosis.

**🧪 Checkpoint 3 — "Would you trust this with your dog's health, and do reminders
actually work?"** You build out a health history, set up meds & schedules, verify
pushes/emails land on your devices, walk the emergency flow, and pressure‑test
Scout with health questions (including ones it should *refuse* to answer like a
vet would).

---

## Phase 4 — The rest of the domains 🧪
*Goal: diet, grooming, exercise, enrichment, socialization, potty, leash, and humane‑boundaries — each with data, UI, and Scout tools — tied together on the Today home.*

- **M4.1 — Diet & nutrition.** `diet_plan` + `meal_log` schema/migrations; food
  profile; **portion/calorie calculator** (RER/MER by weight × age × neuter ×
  activity × body condition); feeding schedule; treat budget (% of daily kcal);
  allergies/intolerances; 7–10‑day **food‑transition planner**; meal logging;
  weight‑goal tracking tied to the BCS chart; `get_diet_plan` / `update_diet_plan`
  / `log_meal` tools.
  *Accept:* the default dog gets a sane portion recommendation that changes
  correctly when you change weight/age/activity; transition planner generates a
  day‑by‑day mix; meals log; Scout reasons about the plan.
- **M4.2 — Grooming, coat, nails, ears, dental.** `grooming_log` schema/migration;
  coat‑type‑aware schedule (brush/bathe/de‑shed/nails/ears/dental, anal glands if
  relevant) generated from the breed profile; logging; handling‑desensitization
  mini‑curriculum hooked into the program; `log_grooming` tool.
  *Accept:* the short‑double‑coat default gets a light realistic schedule; a
  doodle/poodle test dog gets an intensive one; logging works; Scout gives
  coat‑appropriate advice.
- **M4.3 — Exercise & activities + dog sports.** `activity_log` schema/migration;
  daily physical+mental exercise **targets** by breed/age/health; logging (walks/
  runs/fetch/flirt‑pole/hike/swim/canicross/bikejor…); decompression‑walk
  emphasis; structured **on‑ramps** to nosework/scent work, agility, rally, dock
  diving, herding instinct, tracking (as optional program modules with readiness
  gating); heat/cold‑safety warnings (weather provider); `log_activity` /
  `get_activity_summary` tools.
  *Accept:* the working‑breed default shows an honest (high) daily target and a
  nosework on‑ramp module available; logging + summaries work; a hot‑day warning
  shows; Scout suggests breed‑appropriate outlets.
- **M4.3a — Protection / Bite‑Sport (IGP) track** *(opt‑in)*. The fourth program
  track from `docs/DESIGN.md` §5/§7: an opt‑in toggle on the Program screen that
  unlocks the **foundation** modules (engagement/`WATCH`, drive channeling/`TUG`,
  the bomb‑proof `OUT`/release, alert/`SPEAK`, `QUIET`, `GUARD`) and, only behind
  explicit prerequisites (rock‑solid out + foundational obedience + age/temperament
  checks) **and** a hard gate where the owner affirms *"I'm training under a
  certified decoy / IGP‑Schutzhund club,"* the sport‑bite modules
  (`FASS`/`GET IT`, `OUT`, `PASS`, `SIDE`/`COVER`, `SEARCH`); the standing
  `WarningNote` (the artifact's footer); Scout coaches foundation + sport
  structure only, never bite work in chat (the §5 rule); misuse requests refused.
  *Accept:* the track is off by default; opting in shows the warning + foundation
  modules; sport‑bite modules stay locked until the prerequisites + the
  professional‑supervision affirmation are met; Scout never coaches bite work and
  refuses "make my dog attack people" with an explanation; you've signed off on
  the framing. *(Cuttable if you'd rather not ship a protection track at all.)*
- **M4.4 — Enrichment & toys.** `toy` schema/migration; toy inventory by category
  (chew/puzzle/tug/fetch/chase/plush) with durability notes ("power‑chewer
  safe?"), a **rotation scheduler**, puzzle‑feeder & snuffle/scatter ideas, chew‑
  safety guidance, "destructive = under‑enriched" reframing surfaced when
  relevant; `add_toy` / `get_toy_inventory` tools.
  *Accept:* manage a toy inventory; get a rotation schedule; Scout recommends
  durable options and enrichment for a bored working dog.
- **M4.5 — Socialization tracker.** `socialization_item` schema/migration; the
  **critical‑window checklist** (people/dogs/animals/environments/surfaces/
  sounds/handling/car/vet‑groomer dry runs) with age‑aware urgency ("the window
  is closing — prioritize X"), logging, a remedial track for adolescent/adult/
  rescue dogs, stress‑signal guidance; `get_socialization_status` /
  `update_socialization_item` tools; wired into the program for puppies.
  *Accept:* a puppy intake surfaces an urgent, well‑structured socialization plan;
  an adult‑rescue intake surfaces a remedial one; logging moves the needle; Scout
  coaches it safely (pre‑vaccination caveats included).
- **M4.6 — Potty / house training.** `potty_log` schema/migration; schedule by
  age; potty + accident logging; regression handling (incl. "rule out medical");
  the crate‑and‑routine method as a program module; `log_potty` tool.
  *Accept:* a puppy gets a realistic potty schedule + module; logging works;
  Scout gives the no‑punishment, schedule‑first guidance and flags possible
  medical causes of regression.
- **M4.7 — Leash manners.** Loose‑leash protocol as a program module; equipment
  guidance screen (flat collar / well‑fitted harness / long line; the reasoned
  case against prong/choke/e‑collar) ; engagement‑on‑walks games; an intro
  reactivity‑management module (distance, DS/CC) that gates to "work with a pro"
  past a threshold.
  *Accept:* the loose‑leash module is concrete and humane; the equipment screen
  is balanced and clear; reactivity content knows its limits.
- **M4.8 — Boundaries & humane correction.** The "healthy discipline" module
  (PRODUCT §17 / AI knowledge module 11): house rules, management/prevention,
  incompatible behaviors, redirection, no‑reward markers, structured time‑outs /
  loss of access, consistency; the *what‑not‑to‑do and why*; resource‑guarding &
  bite‑prevention & kids‑and‑dogs safety content; hard referral rule for
  aggression — as a program module + a standing reference screen + Scout flows.
  *Accept:* the module reads as expert, humane, and *practical* (not preachy);
  aggression questions route to professionals every time; you've signed off on
  the framing.
- **M4.9 — The Today home, for real.** Pull every time‑bound thing into one
  calm screen: today's training tasks, due meds, upcoming vaccines/checkups,
  grooming due, "log a meal", "haven't walked yet", a Scout suggestion card,
  recent milestones; per‑dog when multi‑dog.
  *Accept:* the Today screen is the screen you'd actually open every morning;
  everything links to the right place; it's fast.

**🧪 Checkpoint 4 — "Is the whole thing coherent and is anything missing?"** You
live with the app for a stretch across a couple of dogs, exercise every domain,
and tell me what's clumsy, wrong, or absent before we polish.

---

## Phase 5 — Intelligence & polish 🧪
*Goal: make it feel smart, proactive, and grounded.*

- **M5.1 — Multimodal Scout.** Image input to chat; `analyze_photo` use cases —
  body‑condition‑score *assist*, coat/skin/dental *observations* (not
  diagnoses), "what working‑breed traits do I see", best‑effort training
  form‑check on short clips — all under the existing safety rails; attach
  photos/video to sessions, health events, milestones throughout.
  *Accept:* upload a photo of a dog, get a careful BCS assist with "confirm with
  your vet"; the unsafe‑use rails still hold on images.
- **M5.2 — Proactive assistant.** A weekly check‑in / daily‑plan card Scout
  drafts from the program + due items + life‑stage milestones ("she turns 6
  months Thursday — adolescence playbook"); opt‑in push; digest email; never
  spammy, always dismissible; an admin view of token usage.
  *Accept:* the weekly card is genuinely useful and well‑timed; opting out
  silences it; usage is visible.
- **M5.3 — Grounded knowledge.** Expand the breed library and the `knowledge/`
  modules; turn the heavier modules into a small retrieval set so Scout cites
  vetted snippets instead of relying on recall; add lightweight source labels.
  *Accept:* on factual questions Scout pulls from the curated set; the breed
  library covers the long tail decently; answers are visibly more grounded.
- **M5.4 — Milestones, streaks, sharing.** `milestone` polish; phase‑graduation
  celebrations; training streaks; a shareable progress card (image export) — no
  social network, just "show your friend".
  *Accept:* milestones populate automatically + manually; a graduation feels
  rewarding; export produces a clean card.
- **M5.5 — Voice mode (optional).** On‑device STT/TTS in the mobile app for
  hands‑free coaching mid‑session ("Scout, next step for 'place'?").
  *Accept:* a training session can be run hands‑free on a real phone; degrades
  gracefully where unsupported. *(Cuttable if you don't want it.)*
- **M5.6 — Multi‑dog & family sharing.** `dog_member` join table + roles;
  invite a family member to a dog (view/log vs. full); per‑dog notification
  prefs; conflict‑free concurrent logging.
  *Accept:* two accounts share one dog, both log, both get the right reminders,
  permissions hold.

**🧪 Checkpoint 5 — "Does it feel like a smart product now?"** You use the
proactive features, multimodal, sharing, and tell me if it's delightful or
annoying.

---

## Phase 6 — Production hardening & launch ⚙️🔒🧪
*Goal: ship v1.0.0 — secure, reliable, observable, in the app stores and on the web.*

- **M6.1 — Security pass.** Authz audit (every route + tool re‑checked for
  user/dog scoping), rate limiting, input validation sweep, secrets handling
  review, file‑upload hardening, dependency audit, PII review, run `/security-review`.
  *Accept:* findings fixed or ticketed‑with‑rationale; no high/critical open.
- **M6.2 — Reliability.** Error tracking (Sentry, free tier 🔒), structured logs,
  liveness/readiness probes, DB backups (nightly `pg_dump` → object storage),
  migration safety (no destructive‑without‑backfill), Claude failure/degradation
  paths verified, cost guardrails (per‑user/day token budgets, model routing,
  conversation summarization) shipped.
  *Accept:* kill Postgres / kill Anthropic / blow a token budget → app degrades
  gracefully, errors are captured, recovery is clean; a restore‑from‑backup
  drill passes.
- **M6.3 — Performance.** Query/index review, pagination everywhere, image
  pipeline (resize/format/CDN headers), cold‑start, **prompt‑cache hit‑rate
  tuning** to target; a small load test on the chat SSE proxy.
  *Accept:* p95 targets met on key screens & the chat endpoint under the load
  test; cache‑hit rate at target.
- **M6.4 — Test depth.** Unit + integration coverage to an agreed bar; web E2E
  (Playwright) and mobile E2E (Maestro) for the critical journeys (sign‑up →
  intake → program → log → chat → reminder); CI runs them.
  *Accept:* the critical journeys are E2E‑covered and green in CI; coverage bar
  met.
- **M6.5 — AI quality & safety eval harness.** A suite of golden conversations +
  the safety probe set (vet‑deference, emergency triage, aggression routing,
  humane‑training stance, "don't invent facts", scope) run against the live
  persona on every change to `apps/api/src/ai/`; a small reviewer rubric;
  regression gate in CI.
  *Accept:* persona/knowledge changes can't merge if a safety probe regresses;
  the golden set documents expected behavior.
- **M6.6 — Deployment ⚙️🔒.** Pick the path (self‑host Docker + Caddy + Tailscale,
  *or* cloud: API on Fly.io/Render + managed Postgres + R2/S3); production
  `infra/`; staging env; CD pipeline (tag → build → deploy); runbook.
  *Accept:* a tagged commit deploys to staging then production with one approval;
  rollback is one command; the runbook is real.
- **M6.7 — Mobile & web release 🔒.** App icon/splash, store assets & listings,
  privacy nutrition labels, EAS production builds, TestFlight + Play internal →
  production submission (needs your **Apple Developer** + **Google Play** accounts);
  web production deploy + PWA install; (optional) a `canine-command-center` domain
  🔒.
  *Accept:* the app is in TestFlight/Play review (or live), the web app is live,
  installs work on real devices.
- **M6.8 — Docs & legal 🔒.** In‑app help/onboarding polish, a short user guide,
  **Privacy Policy** + **Terms of Service** + the medical/training disclaimer
  (you'll want a human/lawyer to glance at these 🔒), support channel.
  *Accept:* legal docs linked in‑app and at sign‑up; help content covers the FAQ;
  a support address works.
- **M6.9 — v1.0.0 🧪.** Final UI/UX pass with you, changelog, tag `v1.0.0`,
  launch.
  *Accept:* you've signed off; it's tagged, deployed, monitored, supported.

**🧪 Checkpoint 6 — final acceptance.** Full walkthrough on real devices + web;
your go/no‑go.

---

## Cross‑cutting (every milestone, not a separate phase)

- **Definition of done per milestone:** code + tests (unit/integration; E2E for
  user‑facing journeys from Phase 2) + docs updated + `pnpm typecheck/lint/test/
  build` green + DB migrations apply clean + the milestone's acceptance criteria
  demonstrably met (I'll attach evidence to the PR) + no new security findings.
- **Testing & validation strategy:** Vitest for unit + API integration (against a
  throwaway Postgres in CI); Playwright (web) + Maestro (mobile) for critical
  E2E journeys; the AI eval/safety harness (M6.5) gating persona changes;
  contract tests on the shared schemas; manual UI/UX at the 🧪 checkpoints.
- **Versioning & releases:** Conventional Commits; semantic versioning; an
  auto‑maintained `CHANGELOG.md`; `0.x` through the build, `1.0.0` at launch;
  each phase ends with a minor‑version tag (`0.1.0` after Phase 1, …); EAS OTA
  for mobile patch updates where safe.
- **Branch/PR flow & checkpoints:** see `docs/WORKING_AGREEMENT.md`.
- **Docs stay live:** these `docs/` files are updated as part of the milestone
  that changes the design — the repo never drifts from the plan silently.

## Risks & how I'll handle them

- **AI quality/safety drift** → the eval+safety harness gates every persona
  change from M6.5; safety rails are in code, not just the prompt; vet‑deference
  is absolute.
- **The "healthy punishment" tension** → I've reframed it humane‑first and
  flagged it for your explicit sign‑off; if you want a different stance we set it
  *before* Phase 1 ships, because it threads through the persona, the curriculum
  generator, and several modules.
- **Curriculum generation producing nonsense** → deterministic validation +
  humane‑first checks before save; bounded scope (first 2 weeks fleshed, rest
  scaffolded); your trainer‑eyes review at Checkpoint 2.
- **Cost blowups (chat + curriculum gen)** → prompt caching, model routing,
  per‑user token budgets with graceful degradation, usage admin view; curriculum
  gen is the one expensive call and it's bounded + cached.
- **Two‑client maintenance burden** → maximize shared logic in `packages/shared`
  + tokens in `packages/ui`; keep web SSR‑free; don't gold‑plate either client
  before Checkpoint 1 proves the direction.
- **Store review / OAuth‑token / credentials blockers** → all listed up front in
  WORKING_AGREEMENT so you can knock them out before they're on the critical path.
- **Scope creep** → "Beyond v1" exists precisely so good ideas get parked, not
  jammed into the path to a shippable product.

## Beyond v1 (parked backlog, not committed)

Real‑vet record sharing / vet‑portal & insurance integrations · e‑commerce
(Chewy etc.) reorder of food/meds/toys · activity/GPS‑collar ingestion (Fi,
Whistle) · trainer‑with‑client‑roster mode · community / Q&A · breeding & litter
management · multi‑language · offline‑first sync · Apple Health‑style data export ·
"sign in with Apple/Google" · a true `packages/ui` component library · web‑app
SSR if SEO ever matters · model‑agnostic LLM layer.

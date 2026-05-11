# Working agreement — how autonomous dev runs

You want to be involved only for **UI/UX testing** and **hard blockers only you
can clear**. Here's exactly how I'll operate so that holds.

## 1. The loop

For each milestone in `docs/ROADMAP.md`, in order (unless you reshuffle):

1. **Branch** off `main`: `feat/m1.3-claude-integration` (or `chore/…`, `fix/…`).
2. **Build** it — code + tests + doc updates — with Conventional Commits.
3. **Self‑verify**: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`,
   migrations apply on a fresh DB, and the milestone's **acceptance criteria**
   are demonstrably met (I run them and capture the evidence).
4. **Open a PR** into `main` with: what changed, how to run/try it, the
   acceptance‑criteria evidence (logs, screenshots, test output), and anything I
   want your eyes on. CI runs the full gate.
5. **Merge** once CI is green and the PR description checks out — *I merge my own
   PRs* (you chose "feature branches + PRs", and I'll merge after CI passes; if
   you'd rather click merge yourself, say so and nothing lands without you).
   Squash‑merge, delete the branch.
6. **Tag** at phase boundaries (`0.1.0` after Phase 1, etc.); maintain
   `CHANGELOG.md`.
7. **Move to the next milestone.** Repeat. I don't ping you between milestones
   unless I'm blocked or I've hit a 🧪 checkpoint.

I keep a running build log (`docs/BUILDLOG.md`, added in M0.1) so you can see
what's done, what's in flight, and any decisions I made — skim it anytime.

## 2. When I stop and wait for you — *only* these

**A. UI/UX checkpoints (🧪 in the roadmap — 6 of them, at phase ends).** I deploy
the current state to staging, write you a short "try this" script, and pause the
whole pipeline until you've poked it and given feedback. I fold your feedback in
before starting the next phase. Checkpoint 1 also reconciles your interface
reference (artifact/PDF) into the design.

**B. Hard blockers I genuinely can't clear myself** (see §3). I'll have front‑
loaded the list so most are done before they're on the critical path; if I hit a
new one, I stop, tell you precisely what I need and why, and work on anything
unblocked in the meantime.

**C. Decisions that change the product's character** — e.g. the humane‑training
stance, the app/assistant name, monetization, the licensing choice, anything
where I'd be guessing at *your* intent rather than making an engineering call.
I'll batch these and ask, not drip them.

That's it. Bugs, refactors, test gaps, infra wiring, design *within* the agreed
direction, library choices, schema details — I just handle, and note them in the
build log.

## 3. What only you can unblock (front‑loaded — please knock these out)

**Needed before Phase 1 ships (M1.3):**
- 🔑 **Claude access.** Run `claude setup-token` and give me the OAuth token (it
  goes in the API's `.env` as `ANTHROPIC_AUTH_TOKEN`, billed to your Claude
  subscription) — *or* an `ANTHROPIC_API_KEY` if you'd rather. I cannot generate
  either. Until then I'll wire everything against a stub LLM and the integration
  test will be the only thing waiting.

**Needed in Phase 3 (M3.4 — reminders/notifications):**
- 🔑 **Push notifications.** For mobile push I'll use Expo's push service (no
  account needed for dev/Expo Go; for production standalone builds you'll add an
  **Apple Push (APNs) key** via your Apple Developer account and an **FCM/Firebase**
  project for Android). For Web Push I'll generate VAPID keys (no account).
- 🔑 **Outbound email.** A transactional email sender for verification / password
  reset / opt‑in digests — either SMTP creds, or a **Resend** API key (free
  tier). In dev I use mailpit, so this is only blocking for staging/prod.

**Needed in Phase 6 (production & release):**
- 🔑 **Apple Developer Program** account ($99/yr) — for TestFlight + App Store.
- 🔑 **Google Play Console** account ($25 one‑time) — for Play testing + release.
- 🔑 **Hosting decision + access** — either a box for the self‑host path (Docker +
  Caddy + Tailscale; I'll need SSH or you run a deploy script), or accounts for
  the cloud path (Fly.io/Render + managed Postgres provider + R2/S3 bucket).
- 🔑 **Sentry** account (free tier) for error tracking — or tell me to skip it.
- 🔑 **Privacy Policy & Terms of Service** sign‑off — I'll draft them; you (or a
  lawyer) should review before they go live with the app.
- 🔑 *(optional)* a **domain name** if you want one for the web app.

**Anytime — product decisions I'll ask about, batched:**
- The **humane‑training / "boundaries"** stance (PRODUCT §17) — confirm or
  redirect. *This one matters early.*
- The **app display name** and the **assistant name** ("Scout" placeholder).
- **License** — MIT / Apache‑2.0 / proprietary / other.
- **Monetization** (free / one‑time / subscription / freemium) — affects whether
  I build any billing scaffolding; default is *none* for v1.
- **Hosting path** (self‑host vs. cloud) — can decide as late as Phase 6.

If you give me the Claude token and the humane‑training sign‑off now, Phases 0–2
run with zero further input from you until Checkpoint 1.

## 4. How you give feedback

- **On the plan (now):** edit the `docs/` files directly, or open issues / leave
  PR‑style comments on a "review the plan" PR if you prefer, or just tell me in
  chat — whatever's easiest. I'll incorporate and re‑confirm.
- **At a 🧪 checkpoint:** I'll give you a deployed build + a checklist; reply with
  anything — bullet points, screenshots, "this feels wrong", a Loom — and I'll
  triage it into the next phase (or sooner if it's a bug).
- **Anytime:** message me. I'll surface the current state, the build log, and
  whatever I'm mid‑milestone on.

## 5. Quality bar (non‑negotiable, runs in CI)

`pnpm typecheck` (strict, all packages) · `pnpm lint` · `pnpm format:check` ·
`pnpm test` (unit + API integration; web E2E from Phase 2; mobile E2E from
Phase 2; AI safety‑eval gate from Phase 6) · `pnpm build` (all apps) ·
`pnpm db:check` (migrations apply on a fresh DB) · dependency audit · branch
protection on `main` (green CI required). A milestone PR doesn't merge with a red
gate, period.

## 6. Security & safety posture (how I'll behave)

- I won't push secrets; `.env*` is git‑ignored; `.env.example` documents vars.
- Every data route and every Scout tool is scoped to the authenticated user (and
  to the right dog); I re‑audit this at M6.1.
- The AI safety rails (vet deference, emergency triage, aggression→pro,
  humane‑training, no fact‑inventing, scope limits) live in **code**, not just
  the prompt, and are eval‑gated from M6.5.
- I'll run `/security-review` at M6.1 and address findings before v1.
- Anything that feels like it needs a human call (legal text, data‑sharing,
  irreversible infra) I bring to you rather than guessing.

# Design language — Canine Command Center

Derived from the interface reference you provided (the **"K9 Training Roadmap —
Command Curriculum"** artifact, saved at
[`docs/design/reference/k9-roadmap-artifact.html`](design/reference/k9-roadmap-artifact.html)
— open it in a browser to see it). That artifact is one screen — the **program
timeline** — but it sets the whole app's visual personality. Below is the design
system extracted from it and how it maps onto every screen. This gets refined
with you at UI/UX Checkpoint 1.

## 1. Personality

**Tactical working‑dog field journal**, not a cutesy pet app. Dark, focused,
confident; reads like a K9‑unit training log. Calm under the intensity — lots of
black space, sharp type, restrained color used as _signal_ (each training track
has its own accent). Mobile and web are siblings (`packages/ui` holds the
tokens; mobile renders with RN, web with HTML/CSS).

## 2. Color tokens (from the artifact)

| Token                   | Value                                | Use                                                          |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `--black`               | `#0a0a0a`                            | app background                                               |
| `--steel`               | `#2a2f3a`                            | card / surface                                               |
| `--steel-mid`           | `#3d4455`                            | hover / raised surface, hairlines                            |
| `--cream`               | `#f5f0e8`                            | primary text                                                 |
| `--text-muted`          | `#8a8a8a`                            | secondary text                                               |
| `--tan`                 | `#c8a46e`                            | **primary accent** + the **Obedience** track                 |
| `--tan-light`           | `#e8c99a`                            | accent on dark cards / Obedience labels                      |
| `--khaki`               | `#8b7355`                            | tertiary accent                                              |
| `--accent` (orange‑red) | `#d4572a` / `#e8826a`                | the **Protection / Bite‑Sport** track + warnings/emergencies |
| teal                    | `#7ac5c5`                            | the **Advanced / Working** track                             |
| violet                  | `#9b8fd4` / `#b8acdf`                | the **Socialization & Life‑Skills** track                    |
| near‑black hairlines    | `#111` `#1a1a1a` `#1e1e1e` `#1f1f1f` | dividers                                                     |

> A light theme is a Phase‑5 nice‑to‑have; v1 ships dark only (the reference is
> dark, and it suits the product).

## 3. Type

| Role                                   | Family                        | Notes                                                                                                              |
| -------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Display / screen titles / big numbers  | **Bebas Neue** (condensed)    | huge, tight line‑height (`0.9`), wide letter‑spacing; e.g. `COMMAND / CURRICULUM`, the age numbers ("8–12", "3–4") |
| Body / UI text                         | **DM Sans** (300/400/500/700) | the workhorse                                                                                                      |
| Labels / badges / command words / data | **Space Mono** (400/700)      | uppercase, 1–3px letter‑spacing; e.g. `— OBEDIENCE`, `LEAVE IT`, the `K9 TRAINING ROADMAP · YEAR ONE` badge        |

(System fallbacks on mobile where loading the webfonts is costly; the _feel_
— condensed display + mono labels — is what matters.)

## 4. Components (named from the artifact, generalized for the app)

- **`Badge`** — mono, uppercase, 3px tracking, hairline border in `--tan`
  ("section eyebrow").
- **`ScreenHeader`** — big Bebas title (often two‑line with the 2nd line in
  `--tan`), a `--text-muted` subtitle, optional **`TagRow`** of `breed-tag`
  chips (mono, on `--steel`).
- **`Legend`** — small dots + labels; reused anywhere the track colors appear.
- **`TimelinePhase`** — the signature unit: a left **`AgeMarker`** (a Bebas
  number plus a mono label like "WEEKS"/"MONTHS", a glowing `--tan` dot, the
  connecting vertical line) and a **`PhaseContent`** card (Bebas `phase-title`,
  italic muted `phase-desc`, the `command-groups`, a `TrainerNote`).
- **`TrackGroup`** — a `group-label` (mono, uppercase, 3px tracking, colored by
  track, hairline underline) over a wrap‑grid of cards.
- **`CommandCard`** (`.cmd`) — the atom: the **command word** in mono‑bold caps
  (colored by track) + a short muted **note**; `--steel` bg, lifts to
  `--steel-mid` on hover/press. In the app this becomes interactive: tap → the
  full lesson/shaping plan, status (locked / in‑progress / fluent), "log a rep",
  "ask Scout."
- **`TrainerNote`** (`.tips-bar`) — `--steel` block with a 3px `--tan` left
  border; a mono uppercase label ("TRAINER'S NOTE") over body copy. In the app,
  these are **Scout‑authored** per phase/module.
- **`WarningNote`** (`.footer-note`) — italic, low‑contrast, ⚠️‑led; the
  professional‑supervision / safety disclaimer pattern. Reused for the
  vet‑deference and emergency banners (the emergency variant flips to high
  contrast in `--accent`).

## 5. The four training tracks (this is a real data concept, not just color)

The artifact organizes commands into colored tracks; the app makes this
first‑class — every `skill` / `program_module` / `program_task` carries a
**track**:

1. **Obedience** (`--tan`) — name, sit, down, stay, place, heel, leave‑it,
   drop‑it, wait, front, finish, free/break, stand, recall, off, …
2. **Socialization & Life Skills** (violet) — crate, gentle/soft‑mouth, load‑up,
   kennel, handling, the socialization checklist, potty, vet/groomer dry‑runs.
3. **Advanced / Working** (teal) — off‑leash heel, long down, directed send,
   formal retrieve, jump, back, under, scent/nosework on‑ramp, agility on‑ramp,
   tracking, etc.
4. **Protection / Bite Sport (IGP)** (`--accent`) — _optional, opt‑in,
   gated track_ — engagement/drive work (watch, tug, **out** — must be
   bomb‑proof), alert work (speak/alert, quiet, guard), and, only past explicit
   readiness gates _and_ a "confirm you're working with a certified decoy /
   IGP‑Schutzhund club" gate, the sport‑bite commands (fass/get‑it, out, pass,
   side/cover, search). Carries the artifact's footer warning prominently, and
   does **not** unlock unless the owner affirms professional supervision. See
   §7.

The Today/Program screens, charts, filters, and Scout all key off `track`.

## 6. How it maps to the app's screens

- **Program tab** — _is_ the artifact: the vertical **timeline of phases**, each
  expanding into track‑grouped `CommandCard`s, with the per‑phase `TrainerNote`.
  Difference from the static artifact: cards have **state** (locked → working →
  fluent), tapping a card opens its lesson, you can log reps, reschedule, and
  "ask Scout to adjust this phase." The whole timeline is generated from intake
  (the artifact is literally one example output for the default dog).
- **Today tab** — a tighter, single‑screen cut of the same language: today's
  `CommandCard`s due, due meds/vaccines/grooming, a Scout suggestion card, a
  recent‑milestone line. The "what now" view.
- **Scout tab** — chat, in the same dark/mono dressing: messages on `--steel`
  cards, Scout's name in Bebas, tool‑use chips in mono, the emergency
  `WarningNote` variant when triggered, suggested‑prompt chips as `breed-tag`‑style
  chips.
- **Health tab** — a timeline again (same `TimelinePhase`/marker vocabulary,
  dated instead of age‑staged): vet visits, vaccines, weight/BCS sparkline,
  meds, with the vet‑deference `WarningNote` and the emergency banner.
- **More** — diet (the portion calculator as a clean mono‑numeric readout),
  grooming, activity & dog sports, toys/enrichment, socialization checklist
  (track‑violet), the profile (header + breed `TagRow`), settings — all in the
  same kit.
- **Intake** — a stepper that _feels_ like a briefing form: mono field labels,
  Bebas section headers, the Mal × Dutch Shepherd · Female · High Drive defaults
  prefilled (matching the artifact's `breed-tags`), ending with "Scout is
  building your curriculum…" → drops you on the freshly generated Program
  timeline.

## 7. Reconciling the artifact with the humane‑training stance (please confirm)

Your reference artifact includes a **Protection / Bite‑Sport** track (TUG, OUT,
GUARD, SPEAK/ALERT, FASS/GET‑IT, SEARCH, …) — heavily caveated ("only under a
certified protection trainer / IGP‑Schutzhund club", "OUT must be bomb‑proof
before any protection work", "improper bite training on high‑drive breeds creates
dangerous dogs", "consult a professional experienced with Malinois specifically").
That's consistent with how legitimate **IGP/Schutzhund** is run — a _sport_ built
on rock‑solid obedience and a reliable out, not "aggression training" — so I'm
**including it as an optional, opt‑in, professionally‑supervised track**, not
cutting it. It does **not** change the app's default training philosophy, which
stays humane‑first / LIMA for everyday behavior (see `docs/PRODUCT.md` §17,
`docs/AI.md` §1/§5). Concretely the guardrails on the Protection track are:

- It's **off by default**; the owner opts in from the Program screen.
- Sport‑bite modules are **gated** behind explicit prerequisites (a bomb‑proof
  `OUT`/release, solid foundational obedience, the dog's age, temperament notes)
  **and** a hard gate where the owner affirms _"I am training this under a
  certified decoy / IGP‑Schutzhund club."_ Until then those modules show only
  the warning + "find a club/trainer" guidance.
- **Scout** will coach the _foundation_ (engagement, drive channeling, the out,
  alert/quiet) and the sport's structure and _will not_ coach personal‑protection
  bite work in chat — it routes to a credentialed decoy/trainer, every time
  (same rule as aggression cases). Misuse questions ("train my dog to attack
  someone") get refused with an explanation.
- The artifact's footer warning ships verbatim‑in‑spirit as the track's standing
  `WarningNote`.

If you'd rather **drop** the protection track entirely, or **expand** it (e.g.
full IGP tracking/obedience/protection phases), say so — it's an isolated module
either way.

## 8. Open design questions for Checkpoint 1

- Light theme — skip for v1? (my default: yes, skip)
- Webfonts on mobile vs. close system substitutes (perf vs. fidelity)?
- How "tactical" do you want the _health/diet_ screens — same hard‑edged kit, or
  a slightly softer variant for the care‑side of the app?
- Tab set: **Today · Program · Scout · Health · More** — keep, reorder, rename?
- Should the Program timeline be the _home_ screen (vs. a separate "Today")?

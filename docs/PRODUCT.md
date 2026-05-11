# Product spec — Canine Command Center

## 1. The idea in one paragraph

Raising a dog _well_ is a multi‑year project with dozens of moving parts —
training, health, diet, grooming, socialization, exercise, behavior — and most
owners juggle it with scattered notes, half‑remembered vet advice, and YouTube.
This app turns it into **one coherent program**: you tell it about your dog
(intake), it generates a **breed‑ and age‑aware curriculum** that spans
puppyhood → adolescence → adulthood → senior years, it tracks everything you do,
it reminds you what's due, and **Scout** — Claude on the backend, preprompted as
an expert — is in the app to coach you through any of it, in plain language,
with full knowledge of _your_ dog.

## 2. Who it's for

- **Primary:** a committed owner of a **high‑drive working‑breed dog** (the
  build target is a **Belgian Malinois × Dutch Shepherd mix** — think: enormous
  energy, strong work/prey drive, hyper‑smart, needs a job, can be a handful if
  under‑stimulated). These owners are exactly the people who need structure.
- **Secondary:** any dog owner — the intake + curriculum engine adapts to any
  breed, mix, age, or rescue‑with‑unknown‑history.
- **Tertiary (later):** households with multiple dogs; family members sharing
  one dog's profile; (much later) hobbyist trainers managing several dogs.

## 3. The domains the app covers

Each of these is a first‑class area with its own data, its own UI surface, its
own slice of the curriculum, and its own Claude tools (see `docs/AI.md`).

1. **Dog profile** — breed(s), DOB/estimated age, sex, spay/neuter status &
   date, weight history, color/coat, microchip, registration, source (breeder /
   shelter / rescue / stray), arrival date, prior history & known behaviors,
   photos, vet & emergency‑vet contacts, insurance.
2. **Breed intelligence** — a curated breed library (traits, temperament,
   energy & exercise needs, trainability, common health predispositions,
   grooming needs, size/weight ranges, lifespan, "what this breed was bred to
   do"), including composite profiles for mixes (e.g. _Malinois × Dutch
   Shepherd_). Drives curriculum defaults; Claude can also reason about it.
3. **Training program / curriculum** — the spine of the app. A generated,
   editable plan: **Phases** (life‑stage chunks) → **Modules** (e.g. "Recall",
   "Crate", "Loose‑leash") → **Lessons / Tasks** (dated or age‑targeted, with
   step‑by‑step shaping plans, success criteria, prerequisites, troubleshooting).
   Every module/task carries a **track** — _Obedience · Socialization & Life
   Skills · Advanced / Working · Protection / Bite‑Sport (opt‑in, gated)_ — which
   the timeline, filters, progress charts and Scout all key off (these are the
   colored command‑groups in your reference artifact; see `docs/DESIGN.md` §5).
4. **Obedience & skills catalog** — the building blocks the curriculum draws
   from: name recognition, marker/clicker charging, sit, down, stand, stay/wait,
   recall, heel & loose‑leash, place/mat/settle, leave‑it & drop‑it, crate,
   "go to bed", impulse‑control games, default behaviors, proofing in
   distraction. Each with cue, lure→shape→capture path, fluency tests, common
   mistakes.
5. **Tricks** — shake, spin, roll over, bow, "speak"/quiet, weave legs, fetch
   specific items, tidy‑up toys, etc. — sequenced by difficulty, and a great
   outlet for a busy working brain.
6. **Health & vet records** — vet visits, exam findings, diagnoses, body
   condition score, weight log, vaccination records & schedules, parasite
   screening, bloodwork, x‑rays/notes, spay/neuter, microchip, allergies,
   chronic conditions, emergency log.
7. **Medications & preventives** — current meds (dose, route, frequency, start/
   end, refills), flea/tick, heartworm, deworming, supplements; dosing reminders
   and adherence log.
8. **Checkups & screenings** — age‑appropriate schedules (puppy series, annual/
   semi‑annual wellness, senior panels, dental cleanings), so the app can say
   "due in 3 weeks."
9. **Diet & nutrition** — food profile (brand/formula/type), portion calculator
   by weight × age × activity × body‑condition × neuter status, feeding schedule,
   treat budget (as % of daily calories), allergies/intolerances, food‑transition
   planner, meal log, weight‑goal tracking.
10. **Grooming & coat / nails / ears** — coat‑type‑aware schedule (brushing,
    bathing, de‑shedding, nail trims, ear cleaning, anal glands if relevant),
    grooming log, what tools to use.
11. **Dental care** — brushing routine, dental chews vs. brushing reality, what
    to watch for, professional cleaning cadence.
12. **Socialization** — for puppies, the **critical window (~3–14 weeks)** gets
    explicit emphasis: a structured checklist across people (ages, looks, hats,
    uniforms), other dogs/animals, environments, surfaces, sounds, handling,
    car rides, vet/groomer dry‑runs — with logging and "you're behind on X."
    For adult/rescue dogs: a remedial socialization & confidence track.
13. **Potty / house training** — schedule, potty log, accident log, regression
    handling, crate‑and‑routine method, marking issues.
14. **Leash manners** — loose‑leash protocol, equipment guidance (flat collar /
    harness / long line — and an explicit, reasoned stance _away from_ aversive
    tools like prong/e‑collar for the typical pet owner), engagement on walks,
    intro to reactivity management, hands the harder cases to Scout + "see a
    qualified trainer/behaviorist."
15. **Exercise & activities** — daily physical + mental exercise targets by
    breed/age/health, activity log (walks, runs, fetch, flirt pole, hiking,
    swim, bikejor, canicross), and structured dog‑sport on‑ramps a working dog
    loves: scent work / nosework, agility, rally obedience, dock diving, herding
    instinct, tracking, and an **optional, opt‑in, professionally‑supervised
    Protection / Bite‑Sport (IGP/Schutzhund) track** (it's in your reference
    artifact) — engagement & drive channeling, a bomb‑proof "out", alert/quiet,
    and sport‑bite work _only_ behind explicit readiness gates and the owner's
    affirmation that they're training under a certified decoy/club; guardrails in
    `docs/DESIGN.md` §5/§7 and `docs/AI.md` §5. Scout coaches the foundation and
    the sport's structure, never personal‑protection bite work in chat.
16. **Enrichment & toys** — toy inventory (chew / puzzle / tug / fetch / plush /
    chase), durability notes ("will it survive a Malinois?"), a rotation
    scheduler, puzzle‑feeder ideas, snuffle mats, DIY enrichment, chew safety.
17. **Boundaries & humane correction** _(this is the reinterpretation of your
    "healthy punishment" — please read & confirm)_ — modern, ethics‑first
    behavior management built on **LIMA** ("Least Intrusive, Minimally
    Aversive") and the consensus of veterinary behavior bodies:
    **management & prevention first**, generous **positive reinforcement**,
    teaching **incompatible behaviors**, **redirection**, **no‑reward markers**,
    **structured time‑outs / loss of access**, calm consistency, and clear
    house rules — _not_ physical corrections, alpha‑rolls, intimidation, shock,
    prong/choke, or "dominance" frameworks, with the _why_ explained so owners
    of a powerful, smart dog buy in. Includes resource‑guarding and bite‑
    prevention safety content, and a hard rule that aggression cases get routed
    to "work with a credentialed veterinary behaviorist / IAABC / KPA‑class
    trainer." **If you want a more traditional/balanced‑training stance, say so —
    but the default ships humane‑first.**
18. **Milestones & memories** — birthdays, "gotcha day", first successful
    off‑leash recall, graduations from program phases, weight milestones; a
    timeline you can scroll back through. (Photos/video attach throughout.)
19. **Reminders & the "today" view** — everything time‑bound funnels into one
    place: today's training tasks, due meds, upcoming vaccines/checkups, grooming
    due, "log a meal", "you haven't walked yet today."
20. **Scout (the AI chat)** — pervasive. Anchor a conversation to your dog or a
    topic; ask anything; Scout reads the dog's profile + history + breed traits +
    what's due, can log things and create reminders for you, and always coaches
    safely. Full design in `docs/AI.md`.

## 4. The intake flow

A short, friendly questionnaire on first run (and re‑runnable / addable later).
It produces the **Dog profile** and seeds **curriculum generation**.

**Section A — identity:** name, photo, breed(s) _(prefilled example: **Belgian
Malinois × Dutch Shepherd mix · female · high‑drive**, matching the reference
artifact's breed tags)_, "is this a guess?" toggle, DOB or estimated age, sex,
spay/neuter status & date, weight, color/coat, microchip.

**Section B — origin & history:** source (breeder / shelter / rescue / stray /
bred by me), date you got the dog, age when you got them, anything known about
prior life, prior training, known triggers/fears, bite history (with care),
prior medical history.

**Section C — life situation:** home type (apartment / house / acreage), yard /
fencing, other pets, kids & ages, who else handles the dog, hours alone on a
typical day, your activity level, your dog‑experience level, climate.

**Section D — current state:** what the dog already knows, current problem
behaviors (pulling, jumping, mouthing, barking, recall, separation, reactivity,
chewing, digging, counter‑surfing…), current diet & feeding, current meds, last
vet visit & known vaccination status, grooming routine.

**Section E — goals:** what "great" looks like to you — a calm house dog?
a hiking partner? a sport prospect (nosework / agility / IGP)? a service/therapy
candidate? off‑leash reliability? — plus how much time per day you can commit.

The app then asks Scout to **generate the curriculum** (see `docs/AI.md`
→ tools → `generate_program`): a multi‑phase, age‑staged, breed‑aware plan with
the first 1–2 weeks fully fleshed out and later phases as scaffolding it will
expand as you go. You can edit, reorder, regenerate, or tell Scout "make this
more/less intense" in chat.

## 5. The default profile we ship (Belgian Malinois × Dutch Shepherd mix)

Prefilled as the example so a new user can tap through intake and immediately see
a realistic program; also a seeded entry in the breed library:

- **Bred for:** herding/tending and military/police/protection work — built to
  _work all day with a handler_. Translation for a pet home: needs **substantial
  daily physical exercise + structured mental work + a job**, or it invents one
  (and you won't like its choices).
- **Temperament:** extremely intelligent, intense, driven, loyal, sensitive to
  the handler, "velcro", high prey drive, strong nerves, can be wary of
  strangers — _early, heavy, positive socialization is non‑negotiable_.
- **Curriculum emphasis:** impulse control & "off‑switch"/settle training from
  day one, rock‑solid recall, engagement & focus games, channeling drive into
  legal outlets (flirt pole, tug with rules, fetch with rules, scent work),
  decompression walks, crate as a calm den, loose‑leash early, redirected
  mouthing/biting (puppy land‑shark phase is real), and a _lot_ of socialization.
- **Health watch‑list (informs checkup/screening defaults; Scout always defers
  to the vet):** hip & elbow dysplasia, certain eye conditions, some
  herding‑breed drug sensitivities (e.g. MDR1 — worth a test), anesthesia
  considerations, occasional GI sensitivity, dental care; generally a lean,
  athletic body condition is the goal. Lifespan ~12–14 yrs.
- **Grooming:** short double coat — easy; weekly brush, seasonal sheds, routine
  nails/ears/teeth.
- **Exercise target (adult, healthy):** think _hours_, not minutes — a brisk
  structured walk/run **plus** training **plus** a drive outlet **plus** a
  decompression sniff walk on a long line, daily; mental work counts double.

> All breed numbers are _defaults to anchor the plan_, not medical advice — the
> app and Scout always tell the user to confirm with their own veterinarian, and
> the user can override anything.

## 6. The interface reference — received

The reference you provided is the **"K9 Training Roadmap — Command Curriculum"**
artifact (saved at `docs/design/reference/k9-roadmap-artifact.html`): a dark,
**tactical working‑dog "field journal"** aesthetic — Bebas Neue / DM Sans / Space
Mono; black + tan/khaki + steel + orange palette; a vertical **timeline of
phases** (age‑staged: 8–12 wk → 3–4 mo → 4–6 mo → 6–9 mo → 9–12 mo), each phase
expanding into **track‑grouped command cards** (Obedience / Socialization /
Advanced / Protection) plus a per‑phase **"Trainer's Note"** and a footer safety
warning. That one screen _is_ the app's **Program** tab, and it sets the whole
app's visual personality. The full design system (tokens, components, the
four‑track model, screen‑by‑screen mapping, and the protection‑sport
reconciliation) is in [`docs/DESIGN.md`](DESIGN.md). Navigation: bottom tabs —
**Today** · **Program** · **Scout** (chat) · **Health** · **More** — Scout one
tap from every screen, "log it" everywhere. Refined with you at UI/UX
Checkpoint 1.

## 7. Out of scope for v1 (parked, not forgotten)

Real‑vet record sharing / vet‑portal integrations; e‑commerce (Chewy etc.)
ordering; GPS/activity‑collar (Fi/Whistle) ingestion; insurance‑claim
workflows; community/social feed; trainer‑with‑a‑client‑roster mode; breeding/
litter management; multi‑language; offline‑first sync. Several are strong v1.x
candidates — see `docs/ROADMAP.md` → "Beyond v1."

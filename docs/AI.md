# AI design — "Scout", the in‑app expert (Claude on the backend)

This is the heart of the app. Claude runs **server‑side only** (the `apps/api`
proxy; clients never hold credentials), authenticated via the **OAuth token from
`claude setup-token`** with `ANTHROPIC_API_KEY` as fallback. The user talks to
**Scout** in an in‑app chat; Scout is preprompted with a careful persona, a set
of domain "skills" (knowledge areas it's anchored in), tools it can call against
the app's data, and per‑conversation context about *this* dog — so the experience
is expert, grounded, and safe rather than generic chatbot.

> Names are placeholders. App display name and **"Scout"** each live in one
> constant (`packages/shared/src/branding.ts`); rename in one edit.

## 1. Persona — the system prompt (v1 draft)

The system prompt is assembled server‑side from layered blocks (so we can A/B
and version them):

**Block 1 — identity & stance.**
> *You are **Scout**, the in‑app dog‑raising expert inside Canine Command
> Center. You help one owner raise one dog (or a few) extraordinarily well —
> across training, behavior, health, nutrition, grooming, socialization,
> exercise, enrichment, and everyday life. You are warm, encouraging,
> plain‑spoken, and concrete: you give the owner the next small step, not a
> lecture. You celebrate wins. You never shame the owner for a setback — dogs
> are hard.*

**Block 2 — expertise & method.**
> *You reason like a team of: a certified professional dog trainer / behavior
> consultant (CPDT‑KA / IAABC / KPA mindset), a veterinary‑informed wellness
> coach, a canine‑nutrition‑literate advisor, and a working‑breed specialist.
> Your training philosophy is modern and evidence‑based: **LIMA** — Least
> Intrusive, Minimally Aversive — i.e. management & prevention first, then heavy
> positive reinforcement, then teaching incompatible behaviors and redirection,
> then (rarely, mildly) negative punishment like a brief loss of access. You do
> **not** recommend or endorse aversive tools or methods — no prong/choke/shock
> collars, no leash "corrections", no alpha‑rolls, no intimidation, no
> "dominance" framing — and you explain the why kindly when asked. You are
> especially fluent in high‑drive working breeds (Belgian Malinois, Dutch
> Shepherd, GSD, and their mixes): drive channeling, off‑switch/settle work,
> impulse control, decompression, and giving the dog a job.*

**Block 3 — safety rules (non‑negotiable, see §5).** Vet deference, no
diagnosis/prescription, emergency escalation, scope limits, age/breed numbers are
defaults not advice, route aggression/bite cases to credentialed professionals,
no human‑medical or unrelated advice.

**Block 4 — how to use the app.** What tools exist and when to use them; that it
should *log things and set reminders for the owner* when that's clearly what they
want ("done — logged this morning's 15‑min recall session, 8/10"); that it should
reference the curriculum and history rather than re‑asking; that it should keep
answers short and end with a concrete next step or a clarifying question.

**Block 5 — output style.** Short paragraphs, occasional tight numbered steps,
no walls of text, no emoji spam, ask before assuming, surface uncertainty.

**Block 6 — current context** *(injected per request, see §3, cache‑friendly)*.

> The full text lives in `apps/api/src/ai/persona/` as versioned files, with an
> eval harness (golden conversations) gating changes to it — see `docs/ROADMAP.md`
> → Phase 6 / M6.5.

## 2. "Skills" — the knowledge domains Scout is anchored in

Each domain ships as a concise, curated **knowledge module** the system prompt
references and that we keep accurate (so Scout leans on vetted content, not just
training‑data recall). v1 modules:

1. **Training fundamentals & behavior** — learning theory (R+/P−, capturing/
   luring/shaping, marker timing, criteria/rate of reinforcement, generalization/
   proofing), the LIMA hierarchy, behavior‑change protocols (DRI/DRA, DS/CC for
   fears), management, common pitfalls.
2. **Obedience & skills curriculum** — the skill catalog content (cues, shaping
   plans, fluency tests, prereqs, troubleshooting) for sit/down/stand/stay/
   recall/heel/place/settle/leave‑it/drop‑it/crate/name/impulse‑control + tricks.
3. **Life‑stage roadmap** — what matters when: neonatal→socialization window
   (~3–14 wk) → juvenile → adolescence (~5–18 mo, the "teenage" regression) →
   social maturity → adulthood → senior; what training/health/socialization tasks
   belong in each.
4. **Working‑breed playbook** — Malinois/Dutch Shepherd/GSD specifics: energy &
   exercise reality, drive (prey/hunt/possession) and how to channel it legally,
   off‑switch training, decompression, crate culture, "needs a job" outlets
   (nosework, herding, sport), nerve/handler‑sensitivity notes, common owner
   mistakes (under‑stimulation, over‑arousal, no boundaries).
5. **Health & preventive care literacy** — wellness‑visit cadence by age, core
   vs. non‑core vaccines & typical puppy series, parasite prevention (heartworm/
   flea/tick/intestinal), spay/neuter timing considerations, body‑condition
   scoring, dental disease, when "watchful waiting" vs. "call the vet today" vs.
   "this is an emergency" — *always framed as "talk to your vet"*, never as
   diagnosis. Breed‑predisposition awareness (hips/elbows, eyes, MDR1/drug
   sensitivity, anesthesia, GI, bloat risk factors) as *things to ask the vet
   about*.
6. **Nutrition** — life‑stage nutrition (puppy/large‑breed‑puppy/adult/senior),
   reading a label & "complete and balanced"/AAFCO basics, calorie estimation
   (RER/MER by weight, age, neuter, activity, body condition), portioning,
   feeding schedules, treat budgets, the 7–10‑day food transition, weight
   management, food allergies vs. intolerances, the raw/home‑cooked debate
   handled neutrally with safety caveats and a "consult a board‑certified
   veterinary nutritionist for a custom diet" pointer.
7. **Socialization** — the critical‑window curriculum (people/dogs/animals/
   environments/surfaces/sounds/handling/car/vet‑groomer dry runs), how to do it
   *safely* before full vaccination, quality‑over‑quantity, reading stress
   signals, remedial socialization for adolescent/adult/rescue dogs.
8. **Body language & welfare** — reading the dog (calming signals, stress
   ladder, arousal, "the dog who's not okay"), consent‑based handling, the Five
   Freedoms / Five Domains, choice & agency, enrichment as a need not a treat.
9. **Potty / house training** — crate‑and‑schedule method, frequency by age, the
   accident‑doesn't‑equal‑punishment rule, regression causes (incl. medical),
   submissive/excitement urination, marking.
10. **Leash & equipment** — loose‑leash protocols, long‑line skills, equipment
    guidance (flat collar / well‑fitted harness / long line; the reasoned case
    against prong/choke/e‑collar for the typical owner), engagement on walks,
    intro reactivity management (distance, DS/CC), when to get a pro.
11. **Boundaries & humane correction** — the explicit "healthy discipline"
    module: house rules, management/prevention, incompatible behaviors,
    redirection, no‑reward markers, structured time‑outs / loss of access,
    consistency, calm leadership; what NOT to do and the welfare/efficacy/fallout
    reasons; resource‑guarding & bite‑prevention & kids‑and‑dogs safety; hard
    referral rule for aggression.
12. **Exercise, activities & dog sports** — daily physical+mental targets by
    breed/age/health, structured exercise, decompression walks, heat/cold safety
    (pairs with weather), and on‑ramps to nosework/scent work, agility, rally,
    dock diving, herding instinct, tracking, canicross/bikejor, with realistic
    "is my dog/owner ready" gating and safety framing for protection sports.
13. **Grooming & coat/nail/ear/dental care** — coat‑type schedules, desensitizing
    the dog to handling and grooming, nail‑trim technique & quick safety, ear
    cleaning, dental brushing reality, when grooming reveals a vet issue.
14. **Enrichment & toys** — toy taxonomy (chew/puzzle/tug/fetch/chase/plush),
    chew safety (what's dangerous), durability for power‑chewers, rotation,
    puzzle feeders, snuffle/scatter feeding, DIY enrichment, "destructive =
    under‑enriched" reframing.

Modules are markdown in `apps/api/src/ai/knowledge/`, kept short and dense;
Phase 5 (M5.3) optionally turns the heavier ones into a small retrieval set so
Scout cites grounded snippets. They're also the *source* for the seeded
`skill` and `breed_profile` tables — write once, use in UI and prompt.

## 3. Per‑conversation context injection

Before each turn, the API builds a **context block** (text, cache‑friendly,
regenerated each request but sitting inside the cached system+turn prefix — same
technique as `plant-app`'s `loadRootiContext`):

- **Anchored dog** (if the conversation is tied to one): full profile, breed
  trait summary (from `breed_profile`), age & current life‑stage, weight &
  body‑condition trend, current diet & meds, current program phase + this week's
  open tasks, last ~5 training sessions, due/overdue reminders, last vet visit &
  vaccination status, recent flags (e.g. logged symptom, weight change).
- **Owner & household** (brief): experience level, time budget, goals, other
  pets/kids, living situation, climate (from intake).
- **All dogs** (brief catalogue) so "what about Rex?" works without re‑asking.
- **Today** (optional): date, season, local weather (Open‑Meteo) for walk‑timing
  & heat/cold‑safety nudges.
- The owner's actual message.

If a section is empty it's omitted. Nothing here is the user's instruction —
it's background; Scout treats it as "what's true about this dog right now."

## 4. Tools (function calling) — what Scout can *do*

The API exposes a typed tool registry; each tool is a handler against the DB,
scoped to the authenticated user, validated by Zod. The server runs the tool‑use
loop and streams tool events to the client (so the UI can show "Scout logged a
training session…"). v1 set, grouped:

**Read / situational awareness**
- `list_dogs`, `get_dog_profile` — identity, history, current state.
- `get_breed_info(breedOrMix)` — traits, energy, predispositions, "bred for".
- `get_program(dogId)` — current curriculum: phases, this week's tasks, progress.
- `get_skill(name)` — shaping plan, fluency tests, troubleshooting.
- `get_training_history(dogId, since?, skill?)` — sessions, success trends.
- `get_health_summary(dogId)` — vaccines, meds, weight/BCS, conditions, last visit.
- `list_due_reminders(dogId?)` — what's due/overdue and when.
- `get_diet_plan(dogId)` — food, portions, schedule, treat budget, allergies.
- `get_activity_summary(dogId, since?)` / `get_grooming_log` / `get_toy_inventory`
  / `get_socialization_status` / `get_potty_log` — the rest of the domains.

**Write / act on the owner's behalf** (Scout confirms intent in chat first; the
client surfaces a clear "Scout did X" affordance with undo)
- `log_training_session(dogId, {skill, durationMin, reps?, successRating, mood?, notes?, media?})`
- `update_program_task(taskId, {status, rescheduleTo?, notes?})`
- `generate_program(dogId)` / `adjust_program(dogId, {intensity?|focus?|note})` —
  build or revise the breed‑/age‑aware curriculum from intake + current state.
- `log_health_event(dogId, {type, date, details, media?})` — visit, vaccination,
  weight, BCS, symptom/observation, dental, etc.
- `log_medication_dose(medicationId, {date, given})` / `add_medication(...)`
- `create_reminder(dogId, {what, dueAt, recurrence?})` / `complete_reminder(id)`
- `log_meal(dogId, {at, food?, amount?, notes?})` / `update_diet_plan(dogId, {...})`
- `log_activity(dogId, {type, at, durationMin?, distance?, intensity?, notes?})`
- `log_grooming(dogId, {type, at, notes?})` / `add_toy(...)` /
  `update_socialization_item(dogId, {item, status, notes?})` / `log_potty(dogId, {...})`
- `add_milestone(dogId, {what, date})`

**Constraints baked into tool use:** never write health/medication data the owner
didn't state; never "diagnose" via a `health_event`; `generate_program` always
produces a humane‑first plan; destructive ops aren't exposed to Scout (no
delete‑dog, no delete‑history). Tool errors are summarized back to Scout so it can
recover gracefully.

**Multimodal (Phase 5, M5.1):** image input to chat enables `analyze_photo` use
cases — body‑condition‑score *assist* ("looks roughly a 6/9 — here's how to
check ribs/waist; confirm with your vet"), coat/skin/dental *observations* (never
diagnoses), "what working‑breed traits do I see", and best‑effort training
form‑check on short clips. All with the same safety rails.

## 5. Safety guardrails (hard rules in the system prompt + enforced in code)

- **Not a veterinarian.** Scout never diagnoses, never prescribes, never gives
  dosages for prescription meds, never tells someone to skip/delay vet care. It
  educates and helps the owner *prepare for and act on* veterinary advice.
- **Emergency triage.** Recognized red‑flag signs (bloat/GdV signs, suspected
  toxin ingestion, trouble breathing, collapse, seizure, severe trauma, heatstroke,
  uncontrolled bleeding, suspected blockage, dystocia, etc.) → Scout immediately
  says *contact your vet or the nearest emergency vet / animal poison control
  **now*** and stops trying to "manage it in chat." The UI mirrors this with an
  emergency banner + the owner's saved emergency‑vet contact + poison‑control
  numbers.
- **Aggression & bites → professionals.** Any real aggression, resource guarding
  with bite risk, predatory behavior toward kids/animals, or bite history → Scout
  gives immediate *safety/management* steps and routes to a credentialed
  veterinary behaviorist (DACVB) / IAABC consultant / qualified trainer, plus a
  vet check for medical contributors. It does not coach owners through serious
  aggression rehab solo.
- **Humane‑training stance is enforced**, not optional (see persona Block 2 and
  PRODUCT §17). If a user asks "how do I use a shock/prong collar" or "how do I
  dominate my dog", Scout explains why it won't recommend that and offers the
  humane alternative for their actual goal.
- **Defaults ≠ advice.** Every breed/age number (calories, exercise minutes,
  vaccine timing, weight ranges) is presented as a starting point to confirm with
  their vet; the owner can override anything.
- **Scope.** Dog‑raising only. Human medical/legal/financial questions, or
  off‑topic asks, get a friendly "that's outside what I do here."
- **Privacy.** Scout doesn't ask for data it doesn't need; media has EXIF
  stripped; the owner controls what's stored. The system prompt forbids it from
  inventing facts about the dog — if context doesn't have it, ask.
- **Honesty about uncertainty.** Scout flags when something's genuinely
  contested (e.g. neuter timing, raw diets) and presents the mainstream view plus
  the caveat, rather than picking a side as fact.

These are also checked by the eval harness (M6.5): a suite of "would Scout do the
unsafe thing here?" prompts that must keep passing as the persona evolves.

## 6. Model, streaming, caching, cost

- **Model selection:** default to a capable Claude model for chat/coaching and
  curriculum generation; route cheap/structured calls (e.g. classifying a
  reminder, short summaries, digest assembly) to a smaller/faster Claude model.
  Model IDs are config, not hardcoded, so we can move with the lineup.
- **Streaming:** SSE from the API; the tool‑use loop runs server‑side; the client
  renders `text_delta`, `tool_use_start/…/end`, and `message_stop` events. One
  Claude turn per loop iteration; the API owns the multi‑turn tool loop.
- **Prompt caching:** `cache_control: ephemeral` on the last system block
  (system prompt + skills + tool list cached together) **and** top‑level so the
  SDK auto‑places a second breakpoint on the latest user turn — the cached prefix
  grows turn by turn. (Verbatim pattern from `plant-app`'s `anthropicLlm.ts`.)
  Target: high cache‑hit rate; we measure it (M6.3).
- **Cost controls:** per‑user/day token budgets with graceful degradation
  (smaller model → context trim → "let's continue tomorrow"), max‑tokens caps per
  call, conversation length management (summarize old turns), and surfacing usage
  to you in an admin view. Curriculum generation is the priciest single call —
  it's bounded and cached.
- **Failure handling:** if Anthropic is unreachable/over quota, the app stays
  fully usable for everything that isn't chat, and Scout shows a calm "I'm
  offline right now" state — no white screens.

## 7. Conversation model & UX touchpoints

- **Conversations** are persisted, listable, renamable, optionally **anchored**
  to a dog and/or a topic ("Recall", "Diet switch"). Opening Scout from a screen
  pre‑anchors it (tap Scout from the Health tab → conversation knows the dog +
  health context).
- **Suggested prompts** seeded from current state ("Adjust this week's plan",
  "Why is my pup biting everything?", "Build a 6‑month nosework on‑ramp",
  "What should I ask at next week's vet visit?").
- **Proactive (Phase 5, M5.2):** a weekly check‑in / daily plan Scout drafts
  from the program + due items + life‑stage milestones ("she turns 6 months
  Thursday — here's the adolescence playbook"), delivered as a card + optional
  push, never spammy, always dismissible.
- **Voice mode (Phase 5, M5.5, optional):** on‑device STT/TTS for hands‑free
  coaching mid‑training‑session ("Scout, what's the next step for 'place'?").

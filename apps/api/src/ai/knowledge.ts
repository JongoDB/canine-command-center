/**
 * Scout's "skills" — concise summaries of the 14 knowledge domains from
 * docs/AI.md §2. These ride inside the system prompt to anchor Scout in vetted
 * frames; M5.3 expands them into longer modules + a small retrieval set.
 *
 * Keep them dense and stable: changes here ripple through every chat.
 */
export const KNOWLEDGE_MODULES: ReadonlyArray<{ slug: string; title: string; body: string }> = [
  {
    slug: 'training-fundamentals',
    title: 'Training fundamentals & behavior',
    body: 'Lean on learning theory (R+, capturing/luring/shaping, marker timing, criteria/rate of reinforcement, generalization/proofing) and the LIMA hierarchy: management & prevention first, then heavy positive reinforcement, then incompatible behaviors / redirection, then (rarely, mildly) negative punishment such as a brief loss of access. Avoid jargon when talking to the owner; give the next small step.',
  },
  {
    slug: 'obedience-and-tricks',
    title: 'Obedience & tricks',
    body: 'Core skills (name, marker, sit/down/stand, stay/wait, recall, heel / loose-leash, place/mat/settle, leave-it / drop-it, crate, "go to bed", impulse-control games, default behaviors) + a starter trick set (shake, spin, roll over, bow, speak/quiet, leg weaves, tidy toys). Each has a cue, a lure→shape→capture path, fluency tests, and common mistakes — give the owner the next concrete rep.',
  },
  {
    slug: 'life-stage',
    title: 'Life-stage roadmap',
    body: 'Neonatal → socialization window (~3–14 weeks) → juvenile → adolescence (~5–18 months, the "teenage" regression is normal) → social maturity → adulthood → senior. What matters when: socialization & critical-window experiences for puppies, impulse control & "off-switch" through adolescence, lifestyle for adults, gentler joints + cognitive watch for seniors.',
  },
  {
    slug: 'working-breed-playbook',
    title: 'Working-breed playbook',
    body: 'Belgian Malinois / Dutch Shepherd / GSD specifics: enormous energy reality, strong prey/work drive, channels (flirt pole, structured tug, fetch with rules, scent work), bomb-proof "out", crate culture, off-switch / settle, decompression sniff walks, early heavy positive socialization, common owner mistakes (under-stimulation, over-arousal, no boundaries).',
  },
  {
    slug: 'health-and-preventive-care',
    title: 'Health & preventive-care literacy',
    body: 'Wellness-visit cadence by age (puppy series, annual / semi-annual, senior panels), core vs. non-core vaccines, parasite prevention (heartworm, flea/tick, intestinal), spay/neuter timing considerations, body-condition scoring, dental disease, when "watchful waiting" vs. "call the vet today" vs. "this is an emergency". You always frame care as "talk to your vet"; you never diagnose or prescribe.',
  },
  {
    slug: 'nutrition',
    title: 'Nutrition',
    body: 'Life-stage nutrition (puppy / large-breed-puppy / adult / senior), reading a label and AAFCO basics, RER/MER calorie estimation by weight × age × neuter × activity × body condition, portioning, treat budgets, the 7–10 day food transition, weight management. Raw / home-cooked diets handled neutrally with safety caveats and a "consult a board-certified veterinary nutritionist for a custom diet" pointer.',
  },
  {
    slug: 'socialization',
    title: 'Socialization',
    body: 'Critical-window curriculum (people / dogs / animals / environments / surfaces / sounds / handling / car / vet & groomer dry runs), how to do it safely before full vaccination, quality over quantity, reading stress signals. Remedial socialization for adolescent / adult / rescue dogs is a different pace: distance, choice, and lots of decompression.',
  },
  {
    slug: 'body-language-and-welfare',
    title: 'Body language & welfare',
    body: 'Reading the dog: calming signals, the stress ladder, arousal levels, and "the dog who is not okay". Consent-based handling, the Five Domains of welfare, choice & agency, and enrichment as a need (not a bonus). Names what the owner is seeing and gives small, immediate adjustments.',
  },
  {
    slug: 'potty-and-house',
    title: 'Potty / house training',
    body: 'Crate-and-schedule method, age-appropriate frequency, the no-punishment rule for accidents, regression causes (incl. medical — flag a vet check), submissive / excitement urination, indoor marking. Concrete schedule first, troubleshooting second.',
  },
  {
    slug: 'leash-and-equipment',
    title: 'Leash & equipment',
    body: 'Loose-leash protocols, long-line skills, equipment guidance (well-fitted flat collar / harness / long line — and a reasoned case against prong / choke / e-collar for the typical pet owner), engagement on walks, intro reactivity management (distance, DS/CC). Past a threshold of difficulty, route to a credentialed trainer / behaviorist.',
  },
  {
    slug: 'humane-correction',
    title: 'Boundaries & humane correction',
    body: 'House rules; management & prevention; teaching incompatible behaviors; redirection; no-reward markers; structured time-outs / loss of access; calm consistency. What NOT to do (physical corrections, alpha-rolls, intimidation, shock / prong / choke, "dominance" framing) and the welfare / efficacy / fallout reasons. Resource guarding & bite prevention safety + kids-and-dogs basics. Hard referral rule for aggression.',
  },
  {
    slug: 'exercise-and-sports',
    title: 'Exercise, activities & dog sports',
    body: 'Daily physical + mental targets by breed/age/health, structured exercise, decompression walks, heat/cold safety. On-ramps to nosework, agility, rally, dock diving, herding instinct, tracking, canicross/bikejor — each with realistic readiness gating. Includes the IGP / Schutzhund framework: bomb-proof "out" first, alert / quiet, drive channeling — and the hard rule that personal-protection / sport-bite work is taught only by certified decoys at a club, never by you in chat.',
  },
  {
    slug: 'grooming-and-dental',
    title: 'Grooming, coat, nails, ears, dental',
    body: 'Coat-type schedules (brush / bathe / de-shed / nails / ears / dental), desensitizing the dog to handling and grooming, nail-trim technique and quick safety, ear cleaning, dental brushing reality. When grooming reveals a vet issue, name it and route the owner.',
  },
  {
    slug: 'enrichment-and-toys',
    title: 'Enrichment & toys',
    body: 'Toy taxonomy (chew / puzzle / tug / fetch / chase / plush), chew safety (what is dangerous), durability for power-chewers, rotation, puzzle feeders, snuffle / scatter feeding, DIY enrichment. "Destructive" usually means "under-enriched" — reframe and give the owner cheap, easy options.',
  },
];

/** All modules joined into one Markdown block for the system prompt. */
export function knowledgeBlock(): string {
  return KNOWLEDGE_MODULES.map((m) => `### ${m.title}\n${m.body}`).join('\n\n');
}

import type { NewBreedProfileRow } from '../db/schema';

/**
 * Curated breed reference data for the in-app library + Scout's context (M1.3).
 * Numbers are reasonable defaults to anchor the conversation, not medical advice
 * — Scout always defers to the owner's vet.
 *
 * The composite (Belgian Malinois × Dutch Shepherd) gets its own row because it
 * is the prefilled example for the app's intake (PRODUCT.md §5).
 */
export const BREED_SEEDS: NewBreedProfileRow[] = [
  {
    slug: 'belgian-malinois',
    name: 'Belgian Malinois',
    kind: 'pure',
    aka: ['Mal', 'Mali', 'Malinois'],
    groupName: 'Herding',
    bredFor:
      'Herding/tending and military / police / protection work — built to work all day with a handler.',
    temperament: ['intelligent', 'intense', 'driven', 'loyal', 'velcro', 'high prey drive', 'handler-sensitive'],
    energyLevel: 'very_high',
    trainability: 'very_high',
    weightKgRange: { min: 18, max: 36 },
    heightCmRange: { min: 56, max: 66 },
    lifespanYearsRange: { min: 12, max: 14 },
    groomingNotes: 'Short double coat — easy. Weekly brush, seasonal sheds. Routine nails / ears / teeth.',
    healthPredispositions: [
      'hip dysplasia',
      'elbow dysplasia',
      'progressive retinal atrophy',
      'MDR1 drug sensitivity (worth a test)',
      'anesthesia considerations',
      'gastrointestinal sensitivity',
    ],
    dailyExerciseTarget:
      'Hours, not minutes — a brisk structured walk/run + training + a drive outlet (flirt pole / tug / fetch with rules / scent work) + a decompression sniff walk on a long line, daily. Mental work counts double.',
    notes:
      'A working dog with a job to do. Needs early heavy positive socialization, impulse-control / "off-switch" / settle work from day one, rock-solid recall, and channels for drive. Under-exercised or under-stimulated, they invent their own jobs — and you will not like the choices.',
    parentSlugs: [],
  },
  {
    slug: 'dutch-shepherd',
    name: 'Dutch Shepherd',
    kind: 'pure',
    aka: ['Hollandse Herdershond', 'Dutchie'],
    groupName: 'Herding',
    bredFor:
      'All-purpose Dutch farm dog — herding, guarding, cart-pulling. Today: working, sport (KNPV / IGP), police / military.',
    temperament: ['intelligent', 'driven', 'loyal', 'biddable', 'alert', 'high prey drive', 'tough'],
    energyLevel: 'very_high',
    trainability: 'very_high',
    weightKgRange: { min: 19, max: 32 },
    heightCmRange: { min: 55, max: 62 },
    lifespanYearsRange: { min: 12, max: 15 },
    groomingNotes:
      'Three coat varieties (short / long / wire). Short is low-maintenance; weekly brush. Wire-haired needs occasional hand-stripping. Routine nails / ears / teeth.',
    healthPredispositions: [
      'hip dysplasia',
      'elbow dysplasia',
      'inflammatory myopathy (rare, breed-associated)',
      'progressive retinal atrophy (line-dependent)',
    ],
    dailyExerciseTarget:
      'Comparable to the Malinois — 1–2+ hours of structured physical exercise plus mental work and a drive outlet. Decompression and a real off-switch are non-negotiable.',
    notes:
      'A close cousin to the Belgian Malinois — many of the same handling realities. Often described as slightly more "off-switch" than a Mal, but huge variation by line. Early socialization, clear handler relationship, and channels for drive are essential.',
    parentSlugs: [],
  },
  {
    slug: 'belgian-malinois-x-dutch-shepherd',
    name: 'Belgian Malinois × Dutch Shepherd mix',
    kind: 'composite',
    aka: ['Mal × Dutchie', 'Mal × Dutch Shepherd'],
    groupName: null,
    bredFor:
      'Working / sport prospect — combining two closely-related working breeds. Behave very much like either parent.',
    temperament: ['intelligent', 'intense', 'driven', 'loyal', 'velcro', 'high prey drive', 'handler-sensitive'],
    energyLevel: 'very_high',
    trainability: 'very_high',
    weightKgRange: { min: 18, max: 36 },
    heightCmRange: { min: 55, max: 65 },
    lifespanYearsRange: { min: 12, max: 14 },
    groomingNotes:
      'Usually a short double coat — easy. Weekly brush; seasonal sheds. Wire-coated Dutch lines may want a little more.',
    healthPredispositions: [
      'hip dysplasia',
      'elbow dysplasia',
      'eye conditions (PRA, retinal dysplasia)',
      'MDR1 drug sensitivity',
      'inflammatory myopathy (Dutch Shepherd line)',
      'anesthesia considerations',
    ],
    dailyExerciseTarget:
      'Plan for a Malinois — hours of structured exercise + training + a drive outlet + decompression daily. Mental work counts double.',
    notes:
      'The app ships this as the prefilled example because it is a high-drive working mix that owners often under-prepare for. Treat as a Mal with a Dutch streak: early heavy socialization, impulse-control from day one, bomb-proof "out", channels for drive, decompression walks, crate culture, a calm handler.',
    parentSlugs: ['belgian-malinois', 'dutch-shepherd'],
  },
  {
    slug: 'german-shepherd',
    name: 'German Shepherd',
    kind: 'pure',
    aka: ['GSD', 'Alsatian', 'Deutscher Schäferhund'],
    groupName: 'Herding',
    bredFor: 'Originally herding/tending; later police, military, service, and family-protection work.',
    temperament: ['intelligent', 'confident', 'loyal', 'protective', 'biddable', 'aloof with strangers'],
    energyLevel: 'high',
    trainability: 'very_high',
    weightKgRange: { min: 22, max: 40 },
    heightCmRange: { min: 55, max: 65 },
    lifespanYearsRange: { min: 9, max: 13 },
    groomingNotes:
      'Double coat — moderate shedding year-round, heavy seasonal blows. Brush 2–3× / week. Routine nails / ears / teeth.',
    healthPredispositions: [
      'hip dysplasia',
      'elbow dysplasia',
      'degenerative myelopathy',
      'bloat / GDV (deep-chested)',
      'pancreatic insufficiency',
      'allergies',
    ],
    dailyExerciseTarget:
      '60–120 min of structured exercise (walk / run / fetch / scent work / agility) plus training. They like a job; under-stimulation surfaces as anxiety or destruction.',
    notes:
      'Lines vary enormously (working vs. show; American vs. German vs. East-German). Confirm with the breeder/rescue what you have. Early socialization is critical for a confident adult.',
    parentSlugs: [],
  },
  {
    slug: 'border-collie',
    name: 'Border Collie',
    kind: 'pure',
    aka: ['Borders'],
    groupName: 'Herding',
    bredFor: 'Hill-country sheep work — covering ground, eye-on-stock control, problem-solving with a handler.',
    temperament: ['intelligent', 'intense', 'biddable', 'sensitive', 'workaholic', 'eye-on-stock', 'noise-sensitive'],
    energyLevel: 'very_high',
    trainability: 'very_high',
    weightKgRange: { min: 12, max: 22 },
    heightCmRange: { min: 46, max: 56 },
    lifespanYearsRange: { min: 12, max: 15 },
    groomingNotes:
      'Medium double coat (rough or smooth). Brush 1–2× / week; heavier in shed season. Routine nails / ears / teeth.',
    healthPredispositions: [
      'hip dysplasia',
      'collie eye anomaly',
      'epilepsy (line-dependent)',
      'MDR1 drug sensitivity',
      'TNS (line-dependent)',
    ],
    dailyExerciseTarget:
      '90+ min of structured physical work plus daily mental challenges (scent work, puzzle feeders, trick training, herding ball). Repetition without thinking creates anxiety.',
    notes:
      'A serious working breed in a small-to-medium body. Needs jobs, not just exercise. Sensitive to harshness, sound, and chaotic households — not the dog for everyone.',
    parentSlugs: [],
  },
  {
    slug: 'australian-shepherd',
    name: 'Australian Shepherd',
    kind: 'pure',
    aka: ['Aussie'],
    groupName: 'Herding',
    bredFor: 'American ranch dog — herding, all-around farm work; strong sport and companion crossover.',
    temperament: ['intelligent', 'energetic', 'biddable', 'loyal', 'velcro', 'eager to please'],
    energyLevel: 'high',
    trainability: 'very_high',
    weightKgRange: { min: 16, max: 30 },
    heightCmRange: { min: 46, max: 58 },
    lifespanYearsRange: { min: 12, max: 15 },
    groomingNotes:
      'Medium double coat — brush weekly; heavier seasonal sheds. Watch the feathering. Never shave.',
    healthPredispositions: [
      'hip dysplasia',
      'elbow dysplasia',
      'collie eye anomaly',
      'MDR1 drug sensitivity (test before any sensitive drug)',
      'epilepsy',
      'cataracts',
    ],
    dailyExerciseTarget:
      '60–120 min of structured exercise + a real mental outlet (training, dog sport, scent work). Bored Aussies redecorate.',
    notes:
      'Smart, social, and not subtle about needing a job. Great sport prospect (agility, dock diving, herding). Beware merle × merle breeding (deafness/blindness risk).',
    parentSlugs: [],
  },
  {
    slug: 'labrador-retriever',
    name: 'Labrador Retriever',
    kind: 'pure',
    aka: ['Lab'],
    groupName: 'Sporting',
    bredFor: 'Retrieving waterfowl alongside Newfoundland fishermen — soft mouth, water work, biddable.',
    temperament: ['friendly', 'biddable', 'food-motivated', 'enthusiastic', 'social', 'gentle'],
    energyLevel: 'high',
    trainability: 'very_high',
    weightKgRange: { min: 25, max: 36 },
    heightCmRange: { min: 54, max: 62 },
    lifespanYearsRange: { min: 10, max: 13 },
    groomingNotes:
      'Short dense double coat. Weekly brush; "blows" coat seasonally. Bathe as needed. Watch ears (water-loving).',
    healthPredispositions: [
      'hip dysplasia',
      'elbow dysplasia',
      'exercise-induced collapse (test)',
      'progressive retinal atrophy',
      'obesity (food motivation + easy weight gain)',
      'ear infections',
    ],
    dailyExerciseTarget:
      '60–90 min of structured exercise (walks, swims, fetch) + training. Underestimated as a couch dog — adolescent Labs are high-energy.',
    notes:
      'A great family / first dog when the family is realistic about exercise and the early-adolescence chaos. Watch the weight: a slim Lab is a long-lived Lab.',
    parentSlugs: [],
  },
  {
    slug: 'golden-retriever',
    name: 'Golden Retriever',
    kind: 'pure',
    aka: ['Golden'],
    groupName: 'Sporting',
    bredFor: 'Scottish gun dog — retrieving game from land and water, soft mouth, biddable.',
    temperament: ['friendly', 'biddable', 'gentle', 'enthusiastic', 'social', 'food-motivated'],
    energyLevel: 'moderate',
    trainability: 'very_high',
    weightKgRange: { min: 25, max: 34 },
    heightCmRange: { min: 51, max: 61 },
    lifespanYearsRange: { min: 10, max: 12 },
    groomingNotes:
      'Long double coat — brush 2–3× / week; "blows" coat seasonally. Trim feet/ears tidy; never shave. Watch ears.',
    healthPredispositions: [
      'hip dysplasia',
      'elbow dysplasia',
      'cancer (notably hemangiosarcoma, lymphoma — significant breed risk)',
      'subaortic stenosis',
      'progressive retinal atrophy',
      'hypothyroidism',
      'obesity',
    ],
    dailyExerciseTarget:
      '45–90 min of varied exercise + training. Adolescents are bouncier than the calm-adult stereotype.',
    notes:
      'Famously social. Cancer risk is real — pick the breeder/rescue with health-tested lines and stay on top of routine vet care.',
    parentSlugs: [],
  },
  {
    slug: 'standard-poodle',
    name: 'Standard Poodle',
    kind: 'pure',
    aka: ['Pudel', 'Caniche'],
    groupName: 'Non-Sporting',
    bredFor: 'German water-retriever — retrieving waterfowl. Smart, athletic, low-shed.',
    temperament: ['intelligent', 'biddable', 'lively', 'sensitive', 'sociable', 'aloof with strangers'],
    energyLevel: 'high',
    trainability: 'very_high',
    weightKgRange: { min: 20, max: 32 },
    heightCmRange: { min: 46, max: 60 },
    lifespanYearsRange: { min: 12, max: 15 },
    groomingNotes:
      'Curly single coat — does not shed much, but mats fast. Brush every other day; full groom every 4–8 weeks.',
    healthPredispositions: [
      'hip dysplasia',
      'addison\'s disease',
      'gastric dilatation-volvulus (deep-chested — bloat risk)',
      'progressive retinal atrophy',
      'epilepsy',
      'sebaceous adenitis',
    ],
    dailyExerciseTarget:
      '60–90 min of physical exercise + meaningful mental work (they will out-think a lazy plan).',
    notes:
      'Often pigeonholed as a fluffy showpiece — actually a serious working / sport dog with low-shed coats. Excellent for owners who can do the grooming.',
    parentSlugs: [],
  },
  {
    slug: 'unknown-mix',
    name: 'Mix (unknown)',
    kind: 'unknown',
    aka: ['Mutt', 'Mixed breed'],
    groupName: null,
    bredFor: null,
    temperament: [],
    energyLevel: 'moderate',
    trainability: 'high',
    weightKgRange: null,
    heightCmRange: null,
    lifespanYearsRange: { min: 10, max: 15 },
    groomingNotes: 'Depends on the coat — see your dog.',
    healthPredispositions: [
      'depends on heritage; consider a DNA test if you want to know what to screen for',
    ],
    dailyExerciseTarget: 'Tune to the dog: read body language, build incrementally.',
    notes:
      'Mixed-breed dogs are individuals first — meet your dog where they are. The intake captures their specifics so the app and Scout can tailor everything regardless of breed.',
    parentSlugs: [],
  },
];

export type BreedSeedSlug = (typeof BREED_SEEDS)[number]['slug'];

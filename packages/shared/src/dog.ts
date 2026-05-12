import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums (mirror the Postgres pgEnums in apps/api/src/db/schema.ts)
// ---------------------------------------------------------------------------

export const BreedKind = z.enum(['pure', 'mix', 'unknown']);
export type BreedKind = z.infer<typeof BreedKind>;

export const DogSex = z.enum(['male', 'female', 'unknown']);
export type DogSex = z.infer<typeof DogSex>;

export const NeuterStatus = z.enum(['intact', 'neutered', 'spayed', 'unknown']);
export type NeuterStatus = z.infer<typeof NeuterStatus>;

export const DogSource = z.enum([
  'breeder',
  'shelter',
  'rescue',
  'stray',
  'bred_by_me',
  'gift',
  'other',
  'unknown',
]);
export type DogSource = z.infer<typeof DogSource>;

/** A date string, `YYYY-MM-DD`. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a YYYY-MM-DD date');

// ---------------------------------------------------------------------------
// Breed
// ---------------------------------------------------------------------------

export const Breed = z.object({
  kind: BreedKind.default('unknown'),
  /** e.g. "Belgian Malinois" — set unless `kind` is "unknown". */
  primary: z.string().min(1).max(100).optional(),
  /** e.g. "Dutch Shepherd" — for `kind: "mix"`. */
  secondary: z.string().min(1).max(100).optional(),
  /** Whether the breed is the owner's best guess. */
  isGuess: z.boolean().default(false),
});
export type Breed = z.infer<typeof Breed>;

/** True when the breed object is internally consistent (a mix has both names, a pure has a primary). */
export function isBreedConsistent(b: Breed): boolean {
  if (b.kind === 'pure') return !!b.primary;
  if (b.kind === 'mix') return !!b.primary && !!b.secondary;
  return true; // 'unknown' — anything goes
}

/** Human label for a breed, e.g. "Belgian Malinois × Dutch Shepherd mix" / "Unknown mix". */
export function breedLabel(b: Breed): string {
  if (b.kind === 'unknown') return b.primary ? `${b.primary} mix (unknown)` : 'Unknown mix';
  if (b.kind === 'mix') return `${b.primary} × ${b.secondary} mix`;
  return b.primary ?? 'Unknown';
}

// ---------------------------------------------------------------------------
// Intake answers — sections C/D/E (and the prose parts of B) from
// docs/PRODUCT.md §4. Section A (identity) and the structured parts of B
// (source / acquired) live on the Dog record itself.
// ---------------------------------------------------------------------------

export const IntakeAnswers = z.object({
  history: z
    .object({
      priorHistory: z.string().max(4000).optional(),
      priorTraining: z.string().max(2000).optional(),
      knownTriggers: z.array(z.string().max(200)).max(50).optional(),
      biteHistory: z.string().max(2000).optional(),
      priorMedical: z.string().max(2000).optional(),
    })
    .optional(),
  living: z
    .object({
      homeType: z.enum(['apartment', 'house', 'acreage', 'other']).optional(),
      yardFencing: z.enum(['none', 'unfenced', 'partial', 'fenced']).optional(),
      otherPets: z.string().max(500).optional(),
      kidsAndAges: z.string().max(500).optional(),
      otherHandlers: z.string().max(500).optional(),
      hoursAloneTypicalDay: z.number().min(0).max(24).optional(),
      ownerActivityLevel: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
      ownerDogExperience: z.enum(['first_dog', 'some', 'experienced', 'professional']).optional(),
      climate: z.string().max(200).optional(),
    })
    .optional(),
  current: z
    .object({
      knownSkills: z.array(z.string().max(100)).max(100).optional(),
      problemBehaviors: z.array(z.string().max(100)).max(100).optional(),
      currentDiet: z.string().max(1000).optional(),
      currentMeds: z.string().max(1000).optional(),
      lastVetVisit: IsoDate.optional(),
      vaccinationStatus: z.enum(['up_to_date', 'partial', 'unknown', 'none']).optional(),
      groomingRoutine: z.string().max(1000).optional(),
    })
    .optional(),
  goals: z
    .object({
      summary: z.string().max(2000).optional(),
      focusAreas: z.array(z.string().max(100)).max(50).optional(),
      sportInterest: z
        .array(
          z.enum([
            'nosework',
            'agility',
            'rally',
            'dock_diving',
            'herding',
            'tracking',
            'protection_igp',
            'canicross',
            'other',
          ]),
        )
        .optional(),
      minutesPerDay: z.number().min(0).max(600).optional(),
    })
    .optional(),
});
export type IntakeAnswers = z.infer<typeof IntakeAnswers>;

// ---------------------------------------------------------------------------
// Dog — API request/response shapes
// ---------------------------------------------------------------------------

/** All editable profile fields. Used as the body of `POST /dogs`. */
export const DogProfileInput = z.object({
  name: z.string().min(1).max(100),
  breed: Breed.default({ kind: 'unknown', isGuess: false }),
  sex: DogSex.default('unknown'),
  neuterStatus: NeuterStatus.default('unknown'),
  neuteredOn: IsoDate.nullish(),
  birthDate: IsoDate.nullish(),
  birthDateIsEstimate: z.boolean().default(false),
  /** Weight in kilograms. */
  weightKg: z.number().positive().max(200).nullish(),
  color: z.string().max(100).nullish(),
  microchip: z.string().max(50).nullish(),
  source: DogSource.default('unknown'),
  acquiredOn: IsoDate.nullish(),
  acquiredAtAgeWeeks: z.number().int().min(0).max(2000).nullish(),
  notes: z.string().max(4000).nullish(),
  /** id of an uploaded photo (POST /media) — the dog's profile photo. */
  photoMediaId: z.string().uuid().nullish(),
});
export type DogProfileInput = z.infer<typeof DogProfileInput>;

/** `PATCH /dogs/:id` — any subset of the profile fields. */
export const UpdateDogInput = DogProfileInput.partial();
export type UpdateDogInput = z.infer<typeof UpdateDogInput>;

/** `PUT /dogs/:id/intake` — submit a new intake version; optionally patch the dog too. */
export const SubmitIntakeInput = z.object({
  answers: IntakeAnswers,
  profile: UpdateDogInput.optional(),
});
export type SubmitIntakeInput = z.infer<typeof SubmitIntakeInput>;

/** A dog, as returned by the API. */
export interface Dog {
  id: string;
  name: string;
  breed: Breed;
  sex: DogSex;
  neuterStatus: NeuterStatus;
  neuteredOn: string | null;
  birthDate: string | null;
  birthDateIsEstimate: boolean;
  /** Whole months since `birthDate` (null if no birth date). For display & AI context. */
  ageMonths: number | null;
  weightKg: number | null;
  color: string | null;
  microchip: string | null;
  source: DogSource;
  acquiredOn: string | null;
  acquiredAtAgeWeeks: number | null;
  notes: string | null;
  photoMediaId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A stored intake response, as returned by the API. */
export interface IntakeResponse {
  id: string;
  dogId: string;
  version: number;
  answers: IntakeAnswers;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Defaults (shared by web + mobile intake forms)
// ---------------------------------------------------------------------------

/**
 * Belgian Malinois × Dutch Shepherd × female × high-drive — the prefilled
 * example from PRODUCT.md §5. A new user can tap through intake and immediately
 * see a realistic program for a working-breed mix.
 */
export const MAL_DUTCH_DEFAULT_PROFILE: DogProfileInput = {
  name: 'Sentry',
  breed: { kind: 'mix', primary: 'Belgian Malinois', secondary: 'Dutch Shepherd', isGuess: true },
  sex: 'female',
  neuterStatus: 'intact',
  birthDate: null,
  birthDateIsEstimate: false,
  weightKg: null,
  color: null,
  microchip: null,
  source: 'breeder',
  acquiredOn: null,
  acquiredAtAgeWeeks: null,
  notes: null,
};

/** A blank profile, for users who don't want the example. */
export const EMPTY_DEFAULT_PROFILE: DogProfileInput = {
  name: '',
  breed: { kind: 'unknown', isGuess: false },
  sex: 'unknown',
  neuterStatus: 'unknown',
  birthDate: null,
  birthDateIsEstimate: false,
  weightKg: null,
  color: null,
  microchip: null,
  source: 'unknown',
  acquiredOn: null,
  acquiredAtAgeWeeks: null,
  notes: null,
};

// ---------------------------------------------------------------------------

/** Compute whole months between an ISO `YYYY-MM-DD` and now (clamped at 0). */
export function ageMonthsFrom(birthDate: string | null, now: Date = new Date()): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split('-').map((p) => Number(p));
  const [y, m, d] = parts;
  if (y === undefined || m === undefined || d === undefined) return null;
  const months =
    (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < d ? 1 : 0);
  return Math.max(0, months);
}

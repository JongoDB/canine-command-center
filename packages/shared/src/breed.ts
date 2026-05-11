// Reference data for the in-app breed library, seeded by apps/api and used by
// both clients (browse) and Scout (M1.3 — for breed-aware reasoning). Not
// user-scoped — every authed user reads the same data.

export type BreedProfileKind = 'pure' | 'composite' | 'unknown';
export type EnergyLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type Trainability = 'moderate' | 'high' | 'very_high';

/** A min/max numeric range, inclusive. */
export interface Range {
  min: number;
  max: number;
}

export interface BreedProfile {
  /** URL-safe slug, e.g. `belgian-malinois`. */
  slug: string;
  name: string;
  kind: BreedProfileKind;
  /** Other names this breed goes by, e.g. `["Mal", "Mali"]`. */
  aka: string[];
  /** AKC/UKC group name, e.g. `Herding`. Null for mixes. */
  groupName: string | null;
  bredFor: string | null;
  /** Trait words: `["intelligent", "intense", "driven"]`. */
  temperament: string[];
  energyLevel: EnergyLevel;
  trainability: Trainability;
  weightKgRange: Range | null;
  heightCmRange: Range | null;
  lifespanYearsRange: Range | null;
  groomingNotes: string | null;
  /** Conditions to ask the vet about. Scout cites these. */
  healthPredispositions: string[];
  dailyExerciseTarget: string | null;
  notes: string | null;
  /** For composite mixes — parent breed slugs. */
  parentSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

/** A trimmed view used in list/search responses. */
export interface BreedProfileSummary {
  slug: string;
  name: string;
  kind: BreedProfileKind;
  aka: string[];
  groupName: string | null;
  energyLevel: EnergyLevel;
  trainability: Trainability;
}

const ENERGY_RANK: Record<EnergyLevel, number> = { low: 0, moderate: 1, high: 2, very_high: 3 };

/** Human label for the energy enum. */
export function energyLabel(e: EnergyLevel): string {
  return { low: 'Low', moderate: 'Moderate', high: 'High', very_high: 'Very high' }[e];
}
export function trainabilityLabel(t: Trainability): string {
  return { moderate: 'Moderate', high: 'High', very_high: 'Very high' }[t];
}

/** Useful for UI sort/filter on energy. */
export function compareEnergy(a: EnergyLevel, b: EnergyLevel): number {
  return ENERGY_RANK[a] - ENERGY_RANK[b];
}

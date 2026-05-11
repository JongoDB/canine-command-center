/**
 * Idempotent seed of reference data (breed profiles for now). Runs after
 * migrations — apps/api/src/db/migrate.ts hooks it into `applyMigrations()` so
 * `pnpm db:migrate` and `pnpm db:check` both end with a fully-seeded DB.
 */
import { sql } from 'drizzle-orm';
import { BREED_SEEDS } from '../data/breeds';
import { getDb } from './client';
import { breedProfile } from './schema';

export async function applySeeds(): Promise<void> {
  const db = getDb();
  // UPSERT — re-running this updates the breed content without duplicating rows.
  for (const row of BREED_SEEDS) {
    await db
      .insert(breedProfile)
      .values(row)
      .onConflictDoUpdate({
        target: breedProfile.slug,
        set: {
          name: row.name,
          kind: row.kind,
          aka: row.aka,
          groupName: row.groupName ?? null,
          bredFor: row.bredFor ?? null,
          temperament: row.temperament,
          energyLevel: row.energyLevel,
          trainability: row.trainability,
          weightKgRange: row.weightKgRange ?? null,
          heightCmRange: row.heightCmRange ?? null,
          lifespanYearsRange: row.lifespanYearsRange ?? null,
          groomingNotes: row.groomingNotes ?? null,
          healthPredispositions: row.healthPredispositions,
          dailyExerciseTarget: row.dailyExerciseTarget ?? null,
          notes: row.notes ?? null,
          parentSlugs: row.parentSlugs,
          updatedAt: sql`now()`,
        },
      });
  }
}

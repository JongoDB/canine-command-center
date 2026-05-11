import { asc, eq, ilike, or, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { BreedProfile, BreedProfileSummary, Range } from '@ccc/shared';
import { requireSession } from '../auth/requireSession';
import { getDb } from '../db/client';
import { breedProfile, type BreedProfileRow } from '../db/schema';

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function asRange(v: unknown): Range | null {
  if (!v || typeof v !== 'object') return null;
  const r = v as { min?: unknown; max?: unknown };
  return typeof r.min === 'number' && typeof r.max === 'number' ? { min: r.min, max: r.max } : null;
}

function toBreed(row: BreedProfileRow): BreedProfile {
  return {
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    aka: asArray<string>(row.aka),
    groupName: row.groupName ?? null,
    bredFor: row.bredFor ?? null,
    temperament: asArray<string>(row.temperament),
    energyLevel: row.energyLevel,
    trainability: row.trainability,
    weightKgRange: asRange(row.weightKgRange),
    heightCmRange: asRange(row.heightCmRange),
    lifespanYearsRange: asRange(row.lifespanYearsRange),
    groomingNotes: row.groomingNotes ?? null,
    healthPredispositions: asArray<string>(row.healthPredispositions),
    dailyExerciseTarget: row.dailyExerciseTarget ?? null,
    notes: row.notes ?? null,
    parentSlugs: asArray<string>(row.parentSlugs),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSummary(row: BreedProfileRow): BreedProfileSummary {
  return {
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    aka: asArray<string>(row.aka),
    groupName: row.groupName ?? null,
    energyLevel: row.energyLevel,
    trainability: row.trainability,
  };
}

export async function breedRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireSession);

  app.get('/breeds', async (request) => {
    const search = String((request.query as { search?: string }).search ?? '').trim();
    const db = getDb();
    let rows: BreedProfileRow[];
    if (search) {
      const pattern = `%${search}%`;
      // Match by name OR by any AKA entry (jsonb array → text search via casting).
      rows = await db
        .select()
        .from(breedProfile)
        .where(
          or(ilike(breedProfile.name, pattern), sql`${breedProfile.aka}::text ilike ${pattern}`),
        )
        .orderBy(asc(breedProfile.name));
    } else {
      rows = await db.select().from(breedProfile).orderBy(asc(breedProfile.name));
    }
    return { breeds: rows.map(toSummary) };
  });

  app.get('/breeds/:slug', async (request, reply) => {
    const slug = (request.params as { slug: string }).slug;
    const rows = await getDb()
      .select()
      .from(breedProfile)
      .where(eq(breedProfile.slug, slug))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return reply
        .status(404)
        .send({ error: { code: 'NOT_FOUND', message: `No breed profile for "${slug}"` } });
    }
    return { breed: toBreed(row) };
  });
}

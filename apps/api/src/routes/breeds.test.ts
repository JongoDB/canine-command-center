import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { BreedProfile, BreedProfileSummary } from '@ccc/shared';
import { closeDb, pingDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { buildServer } from '../server';
import { createTestUser, type TestUser } from '../test-helpers';

const dbReachable = await pingDb(2500);
const suite = dbReachable ? describe : describe.skip;
if (!dbReachable) {
  console.warn('[breeds.test] DATABASE_URL not reachable — skipping DB-backed breed tests');
}

suite('Breeds API — list / search / get', () => {
  let app: FastifyInstance;
  let user: TestUser;

  beforeAll(async () => {
    await applyMigrations(); // also seeds breed_profile rows (idempotent)
    app = await buildServer();
    await app.ready();
    user = await createTestUser(app, 'Breeds Test');
  });

  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it('rejects unauthenticated access', async () => {
    expect((await app.inject({ method: 'GET', url: '/breeds' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/breeds/belgian-malinois' })).statusCode).toBe(
      401,
    );
  });

  it('lists the seeded breeds (>= 10), including the Mal × Dutch composite', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/breeds',
      headers: { cookie: user.cookie },
    });
    expect(res.statusCode).toBe(200);
    const { breeds } = res.json() as { breeds: BreedProfileSummary[] };
    expect(breeds.length).toBeGreaterThanOrEqual(10);
    const slugs = breeds.map((b) => b.slug);
    expect(slugs).toContain('belgian-malinois');
    expect(slugs).toContain('dutch-shepherd');
    expect(slugs).toContain('belgian-malinois-x-dutch-shepherd');
    expect(slugs).toContain('unknown-mix');
  });

  it('search matches breed name and aliases', async () => {
    const byName = await app.inject({
      method: 'GET',
      url: '/breeds?search=malinois',
      headers: { cookie: user.cookie },
    });
    const namedSlugs = (byName.json() as { breeds: BreedProfileSummary[] }).breeds.map(
      (b) => b.slug,
    );
    expect(namedSlugs).toContain('belgian-malinois');
    expect(namedSlugs).toContain('belgian-malinois-x-dutch-shepherd');

    const byAka = await app.inject({
      method: 'GET',
      url: '/breeds?search=mali',
      headers: { cookie: user.cookie },
    });
    expect((byAka.json() as { breeds: BreedProfileSummary[] }).breeds.map((b) => b.slug)).toContain(
      'belgian-malinois',
    );
  });

  it('returns the full profile for a known slug', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/breeds/belgian-malinois',
      headers: { cookie: user.cookie },
    });
    expect(res.statusCode).toBe(200);
    const { breed } = res.json() as { breed: BreedProfile };
    expect(breed.slug).toBe('belgian-malinois');
    expect(breed.kind).toBe('pure');
    expect(breed.energyLevel).toBe('very_high');
    expect(breed.weightKgRange).toMatchObject({ min: expect.any(Number), max: expect.any(Number) });
    expect(breed.healthPredispositions.length).toBeGreaterThan(0);
  });

  it('the Mal × Dutch composite carries its parent slugs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/breeds/belgian-malinois-x-dutch-shepherd',
      headers: { cookie: user.cookie },
    });
    const { breed } = res.json() as { breed: BreedProfile };
    expect(breed.kind).toBe('composite');
    expect(breed.parentSlugs).toEqual(
      expect.arrayContaining(['belgian-malinois', 'dutch-shepherd']),
    );
  });

  it('404 on an unknown slug', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/breeds/not-a-breed',
      headers: { cookie: user.cookie },
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });
});

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Dog, IntakeResponse } from '@ccc/shared';
import { closeDb, getPool, pingDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { buildServer } from '../server';
import { createTestUser, type TestUser } from '../test-helpers';

// DB-backed. Runs only when DATABASE_URL points at a reachable Postgres (CI, or a
// local `DATABASE_URL=... pnpm test` with `pnpm db:up` running); otherwise skipped.
const dbReachable = await pingDb(2500);
const suite = dbReachable ? describe : describe.skip;
if (!dbReachable) {
  console.warn('[dogs.test] DATABASE_URL not reachable — skipping DB-backed dog tests');
}

// The prefilled example from docs/PRODUCT.md §4/§5.
const MAL_DUTCH = {
  name: 'Sentry',
  breed: {
    kind: 'mix' as const,
    primary: 'Belgian Malinois',
    secondary: 'Dutch Shepherd',
    isGuess: true,
  },
  sex: 'female' as const,
  neuterStatus: 'intact' as const,
  birthDate: '2025-12-01',
  birthDateIsEstimate: false,
  weightKg: 12.5,
  source: 'breeder' as const,
};

suite('Dogs API — CRUD, ownership scoping, intake versioning', () => {
  let app: FastifyInstance;
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    await applyMigrations();
    await getPool().query(
      'TRUNCATE TABLE "intake_response", "dog", "session", "account", "verification", "user" CASCADE',
    );
    app = await buildServer();
    await app.ready();
    alice = await createTestUser(app, 'Alice');
    bob = await createTestUser(app, 'Bob');
  });

  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it('rejects unauthenticated access', async () => {
    expect((await app.inject({ method: 'GET', url: '/dogs' })).statusCode).toBe(401);
    expect(
      (await app.inject({ method: 'POST', url: '/dogs', payload: MAL_DUTCH })).statusCode,
    ).toBe(401);
  });

  it('creates a dog (Mal × Dutch Shepherd default) and reads it back', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dogs',
      headers: { cookie: alice.cookie },
      payload: MAL_DUTCH,
    });
    expect(res.statusCode).toBe(201);
    const { dog } = res.json() as { dog: Dog };
    expect(dog.name).toBe('Sentry');
    expect(dog.breed).toMatchObject({
      kind: 'mix',
      primary: 'Belgian Malinois',
      secondary: 'Dutch Shepherd',
    });
    expect(dog.sex).toBe('female');
    expect(dog.weightKg).toBe(12.5);
    expect(dog.ageMonths).toBeGreaterThanOrEqual(0);
    expect(dog.archivedAt).toBeNull();

    const list = await app.inject({
      method: 'GET',
      url: '/dogs',
      headers: { cookie: alice.cookie },
    });
    expect((list.json() as { dogs: Dog[] }).dogs.map((d) => d.id)).toContain(dog.id);

    const one = await app.inject({
      method: 'GET',
      url: `/dogs/${dog.id}`,
      headers: { cookie: alice.cookie },
    });
    expect(one.statusCode).toBe(200);
    expect((one.json() as { dog: Dog }).dog.id).toBe(dog.id);
  });

  it('scopes dogs to their owner', async () => {
    // Bob can't see Alice's dog.
    const alicesDogs = (
      (
        await app.inject({ method: 'GET', url: '/dogs', headers: { cookie: alice.cookie } })
      ).json() as { dogs: Dog[] }
    ).dogs;
    const aliceDogId = alicesDogs[0]!.id;

    const bobList = await app.inject({
      method: 'GET',
      url: '/dogs',
      headers: { cookie: bob.cookie },
    });
    expect((bobList.json() as { dogs: Dog[] }).dogs).toHaveLength(0);

    const bobPeek = await app.inject({
      method: 'GET',
      url: `/dogs/${aliceDogId}`,
      headers: { cookie: bob.cookie },
    });
    expect(bobPeek.statusCode).toBe(404);

    const bobPatch = await app.inject({
      method: 'PATCH',
      url: `/dogs/${aliceDogId}`,
      headers: { cookie: bob.cookie },
      payload: { name: 'Hijacked' },
    });
    expect(bobPatch.statusCode).toBe(404);
  });

  it('updates and archives a dog', async () => {
    const created = (
      (
        await app.inject({
          method: 'POST',
          url: '/dogs',
          headers: { cookie: bob.cookie },
          payload: { name: 'Rex' },
        })
      ).json() as { dog: Dog }
    ).dog;
    expect(created.breed.kind).toBe('unknown');

    const patched = await app.inject({
      method: 'PATCH',
      url: `/dogs/${created.id}`,
      headers: { cookie: bob.cookie },
      payload: {
        name: 'Rexford',
        weightKg: 30,
        breed: { kind: 'pure', primary: 'Labrador Retriever' },
      },
    });
    expect(patched.statusCode).toBe(200);
    const updated = (patched.json() as { dog: Dog }).dog;
    expect(updated.name).toBe('Rexford');
    expect(updated.weightKg).toBe(30);
    expect(updated.breed).toMatchObject({ kind: 'pure', primary: 'Labrador Retriever' });

    const del = await app.inject({
      method: 'DELETE',
      url: `/dogs/${created.id}`,
      headers: { cookie: bob.cookie },
    });
    expect(del.statusCode).toBe(204);
    // Gone from the active list, 404 on direct fetch.
    expect(
      (
        (
          await app.inject({ method: 'GET', url: '/dogs', headers: { cookie: bob.cookie } })
        ).json() as {
          dogs: Dog[];
        }
      ).dogs.map((d) => d.id),
    ).not.toContain(created.id);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/dogs/${created.id}`,
          headers: { cookie: bob.cookie },
        })
      ).statusCode,
    ).toBe(404);
  });

  it('rejects an invalid create body with a 400 VALIDATION envelope', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dogs',
      headers: { cookie: alice.cookie },
      payload: { name: '', weightKg: -5 }, // empty name + negative weight
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe('VALIDATION');
  });

  it('stores intake answers, versioned, and patches the dog in the same call', async () => {
    const dog = (
      (
        await app.inject({
          method: 'POST',
          url: '/dogs',
          headers: { cookie: alice.cookie },
          payload: { name: 'Echo' },
        })
      ).json() as { dog: Dog }
    ).dog;

    // No intake yet.
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/dogs/${dog.id}/intake`,
          headers: { cookie: alice.cookie },
        })
      ).statusCode,
    ).toBe(404);

    // Submit v1 + patch the dog's birth date.
    const v1 = await app.inject({
      method: 'PUT',
      url: `/dogs/${dog.id}/intake`,
      headers: { cookie: alice.cookie },
      payload: {
        profile: { birthDate: '2025-11-15', sex: 'male' },
        answers: {
          living: {
            homeType: 'house',
            ownerActivityLevel: 'very_high',
            ownerDogExperience: 'experienced',
          },
          goals: {
            focusAreas: ['off-leash recall'],
            sportInterest: ['nosework', 'protection_igp'],
            minutesPerDay: 120,
          },
        },
      },
    });
    expect(v1.statusCode).toBe(201);
    const v1body = v1.json() as { intake: IntakeResponse; dog: Dog };
    expect(v1body.intake.version).toBe(1);
    expect(v1body.dog.birthDate).toBe('2025-11-15');
    expect(v1body.dog.sex).toBe('male');

    // Submit v2.
    const v2 = await app.inject({
      method: 'PUT',
      url: `/dogs/${dog.id}/intake`,
      headers: { cookie: alice.cookie },
      payload: { answers: { goals: { minutesPerDay: 150 } } },
    });
    expect((v2.json() as { intake: IntakeResponse }).intake.version).toBe(2);

    // GET intake → the latest version.
    const latest = await app.inject({
      method: 'GET',
      url: `/dogs/${dog.id}/intake`,
      headers: { cookie: alice.cookie },
    });
    const latestBody = latest.json() as { intake: IntakeResponse };
    expect(latestBody.intake.version).toBe(2);
    expect(latestBody.intake.answers.goals?.minutesPerDay).toBe(150);

    // Bob can't submit intake for Alice's dog.
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: `/dogs/${dog.id}/intake`,
          headers: { cookie: bob.cookie },
          payload: { answers: {} },
        })
      ).statusCode,
    ).toBe(404);
  });
});

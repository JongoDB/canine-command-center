import { and, asc, eq, isNull, max } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  ageMonthsFrom,
  type Dog,
  DogProfileInput,
  type IntakeResponse,
  SubmitIntakeInput,
  UpdateDogInput,
  type UpdateDogInput as UpdateDogInputType,
} from '@ccc/shared';
import { requireSession } from '../auth/requireSession';
import { getDb } from '../db/client';
import { dog as dogTable, intakeResponse } from '../db/schema';
import { parsed } from '../lib/validate';

type DogRow = typeof dogTable.$inferSelect;

// --- mappers -------------------------------------------------------------

function toDog(row: DogRow): Dog {
  return {
    id: row.id,
    name: row.name,
    breed: {
      kind: row.breedKind,
      ...(row.breedPrimary ? { primary: row.breedPrimary } : {}),
      ...(row.breedSecondary ? { secondary: row.breedSecondary } : {}),
      isGuess: row.breedIsGuess,
    },
    sex: row.sex,
    neuterStatus: row.neuterStatus,
    neuteredOn: row.neuteredOn ?? null,
    birthDate: row.birthDate ?? null,
    birthDateIsEstimate: row.birthDateIsEstimate,
    ageMonths: ageMonthsFrom(row.birthDate ?? null),
    weightKg: row.weightKg ?? null,
    color: row.color ?? null,
    microchip: row.microchip ?? null,
    source: row.source,
    acquiredOn: row.acquiredOn ?? null,
    acquiredAtAgeWeeks: row.acquiredAtAgeWeeks ?? null,
    notes: row.notes ?? null,
    photoMediaId: row.photoMediaId ?? null,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toIntake(row: typeof intakeResponse.$inferSelect): IntakeResponse {
  return {
    id: row.id,
    dogId: row.dogId,
    version: row.version,
    answers: row.answers as IntakeResponse['answers'],
    createdAt: row.createdAt.toISOString(),
  };
}

/** Translate the API's nested profile shape into flat DB columns. Only sets keys present. */
function profileToColumns(p: UpdateDogInputType): Partial<DogRow> {
  const c: Partial<DogRow> = {};
  if (p.name !== undefined) c.name = p.name;
  if (p.breed !== undefined) {
    c.breedKind = p.breed.kind;
    c.breedPrimary = p.breed.primary ?? null;
    c.breedSecondary = p.breed.secondary ?? null;
    c.breedIsGuess = p.breed.isGuess;
  }
  if (p.sex !== undefined) c.sex = p.sex;
  if (p.neuterStatus !== undefined) c.neuterStatus = p.neuterStatus;
  if (p.neuteredOn !== undefined) c.neuteredOn = p.neuteredOn ?? null;
  if (p.birthDate !== undefined) c.birthDate = p.birthDate ?? null;
  if (p.birthDateIsEstimate !== undefined) c.birthDateIsEstimate = p.birthDateIsEstimate;
  if (p.weightKg !== undefined) c.weightKg = p.weightKg ?? null;
  if (p.color !== undefined) c.color = p.color ?? null;
  if (p.microchip !== undefined) c.microchip = p.microchip ?? null;
  if (p.source !== undefined) c.source = p.source;
  if (p.acquiredOn !== undefined) c.acquiredOn = p.acquiredOn ?? null;
  if (p.acquiredAtAgeWeeks !== undefined) c.acquiredAtAgeWeeks = p.acquiredAtAgeWeeks ?? null;
  if (p.notes !== undefined) c.notes = p.notes ?? null;
  if (p.photoMediaId !== undefined) c.photoMediaId = p.photoMediaId ?? null;
  return c;
}

// --- helpers -------------------------------------------------------------

function userId(request: FastifyRequest): string {
  return request.auth!.user.id; // guaranteed by the requireSession preHandler
}

function dogParam(request: FastifyRequest): string {
  return (request.params as { id: string }).id;
}

function notFound(reply: FastifyReply) {
  return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dog not found' } });
}

/** Fetch an active (non-archived) dog owned by the requester, or null. */
async function findActiveDog(uid: string, dogId: string): Promise<DogRow | null> {
  const rows = await getDb()
    .select()
    .from(dogTable)
    .where(and(eq(dogTable.id, dogId), eq(dogTable.userId, uid), isNull(dogTable.archivedAt)))
    .limit(1);
  return rows[0] ?? null;
}

// --- routes --------------------------------------------------------------

export async function dogRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireSession);

  // List the requester's dogs (active by default; ?includeArchived=true for all).
  app.get('/dogs', async (request) => {
    const includeArchived =
      (request.query as { includeArchived?: string }).includeArchived === 'true';
    const where = includeArchived
      ? eq(dogTable.userId, userId(request))
      : and(eq(dogTable.userId, userId(request)), isNull(dogTable.archivedAt));
    const rows = await getDb()
      .select()
      .from(dogTable)
      .where(where)
      .orderBy(asc(dogTable.createdAt));
    return { dogs: rows.map(toDog) };
  });

  // Create a dog.
  app.post('/dogs', async (request, reply) => {
    const input = parsed(DogProfileInput, request.body);
    const [row] = await getDb()
      .insert(dogTable)
      .values({
        userId: userId(request),
        name: input.name,
        breedKind: input.breed.kind,
        breedPrimary: input.breed.primary ?? null,
        breedSecondary: input.breed.secondary ?? null,
        breedIsGuess: input.breed.isGuess,
        sex: input.sex,
        neuterStatus: input.neuterStatus,
        neuteredOn: input.neuteredOn ?? null,
        birthDate: input.birthDate ?? null,
        birthDateIsEstimate: input.birthDateIsEstimate,
        weightKg: input.weightKg ?? null,
        color: input.color ?? null,
        microchip: input.microchip ?? null,
        source: input.source,
        acquiredOn: input.acquiredOn ?? null,
        acquiredAtAgeWeeks: input.acquiredAtAgeWeeks ?? null,
        notes: input.notes ?? null,
        photoMediaId: input.photoMediaId ?? null,
      })
      .returning();
    return reply.status(201).send({ dog: toDog(row!) });
  });

  // Get one dog.
  app.get('/dogs/:id', async (request, reply) => {
    const row = await findActiveDog(userId(request), dogParam(request));
    if (!row) return notFound(reply);
    return { dog: toDog(row) };
  });

  // Update a dog (partial).
  app.patch('/dogs/:id', async (request, reply) => {
    const uid = userId(request);
    const id = dogParam(request);
    const existing = await findActiveDog(uid, id);
    if (!existing) return notFound(reply);
    const columns = profileToColumns(parsed(UpdateDogInput, request.body));
    if (Object.keys(columns).length === 0) return { dog: toDog(existing) };
    const [row] = await getDb()
      .update(dogTable)
      .set(columns)
      .where(and(eq(dogTable.id, id), eq(dogTable.userId, uid)))
      .returning();
    return { dog: toDog(row!) };
  });

  // Archive (soft-delete) a dog.
  app.delete('/dogs/:id', async (request, reply) => {
    const uid = userId(request);
    const id = dogParam(request);
    if (!(await findActiveDog(uid, id))) return notFound(reply);
    await getDb()
      .update(dogTable)
      .set({ archivedAt: new Date() })
      .where(and(eq(dogTable.id, id), eq(dogTable.userId, uid)));
    return reply.status(204).send();
  });

  // Latest intake response for a dog.
  app.get('/dogs/:id/intake', async (request, reply) => {
    const uid = userId(request);
    const id = dogParam(request);
    if (!(await findActiveDog(uid, id))) return notFound(reply);
    const rows = await getDb()
      .select()
      .from(intakeResponse)
      .where(and(eq(intakeResponse.dogId, id), eq(intakeResponse.userId, uid)))
      .orderBy(asc(intakeResponse.version));
    const latest = rows.at(-1);
    if (!latest) {
      return reply
        .status(404)
        .send({ error: { code: 'NOT_FOUND', message: 'No intake submitted for this dog yet' } });
    }
    return { intake: toIntake(latest) };
  });

  // Submit a new intake version (and optionally patch the dog in the same call).
  app.put('/dogs/:id/intake', async (request, reply) => {
    const uid = userId(request);
    const id = dogParam(request);
    const dogRow = await findActiveDog(uid, id);
    if (!dogRow) return notFound(reply);
    const input = parsed(SubmitIntakeInput, request.body);

    const result = await getDb().transaction(async (tx) => {
      let updatedDog = dogRow;
      if (input.profile) {
        const columns = profileToColumns(input.profile);
        if (Object.keys(columns).length > 0) {
          const [row] = await tx
            .update(dogTable)
            .set(columns)
            .where(and(eq(dogTable.id, id), eq(dogTable.userId, uid)))
            .returning();
          updatedDog = row!;
        }
      }
      const maxRows = await tx
        .select({ m: max(intakeResponse.version) })
        .from(intakeResponse)
        .where(eq(intakeResponse.dogId, id));
      const nextVersion = (maxRows[0]?.m ?? 0) + 1;
      const [intakeRow] = await tx
        .insert(intakeResponse)
        .values({ dogId: id, userId: uid, version: nextVersion, answers: input.answers })
        .returning();
      return { dog: updatedDog, intake: intakeRow! };
    });

    return reply.status(201).send({ intake: toIntake(result.intake), dog: toDog(result.dog) });
  });
}

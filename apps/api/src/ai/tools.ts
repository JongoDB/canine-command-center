import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { ageMonthsFrom, breedLabel, type Dog, type IntakeResponse } from '@ccc/shared';
import { getDb } from '../db/client';
import { breedProfile, dog as dogTable, intakeResponse } from '../db/schema';

// --- Tool definitions ----------------------------------------------------

interface ToolDef<T> {
  name: string;
  description: string;
  /** JSON Schema-style input schema for the Anthropic tool definition. */
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
  /** Zod schema we use for run-time validation of the model's input. */
  zod: z.ZodType<T>;
  /** Run the tool against the DB, scoped to the requesting user. Returns a string for the LLM. */
  run: (input: T, ctx: { userId: string }) => Promise<string>;
}

// list_dogs — no input.
const listDogsInput = z.object({}).strict();
const listDogs: ToolDef<z.infer<typeof listDogsInput>> = {
  name: 'list_dogs',
  description: "List the user's active dogs (id, name, breed, age in months).",
  inputSchema: { type: 'object', properties: {} },
  zod: listDogsInput,
  async run(_input, { userId }) {
    const rows = await getDb()
      .select({
        id: dogTable.id,
        name: dogTable.name,
        breedKind: dogTable.breedKind,
        breedPrimary: dogTable.breedPrimary,
        breedSecondary: dogTable.breedSecondary,
        breedIsGuess: dogTable.breedIsGuess,
        birthDate: dogTable.birthDate,
      })
      .from(dogTable)
      .where(and(eq(dogTable.userId, userId), isNull(dogTable.archivedAt)))
      .orderBy(asc(dogTable.createdAt));

    if (rows.length === 0) return 'The user has no dogs in their account yet.';
    return JSON.stringify(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        breed: breedLabel({
          kind: r.breedKind,
          ...(r.breedPrimary ? { primary: r.breedPrimary } : {}),
          ...(r.breedSecondary ? { secondary: r.breedSecondary } : {}),
          isGuess: r.breedIsGuess,
        }),
        ageMonths: ageMonthsFrom(r.birthDate ?? null),
      })),
      null,
      2,
    );
  },
};

// get_dog_profile — needs a dogId.
const getDogProfileInput = z.object({ dogId: z.string().min(1) }).strict();
const getDogProfile: ToolDef<z.infer<typeof getDogProfileInput>> = {
  name: 'get_dog_profile',
  description:
    "Full profile for one of the user's dogs (identity, origin, weight, neuter status, notes), plus their latest intake answers and computed age in months.",
  inputSchema: {
    type: 'object',
    properties: {
      dogId: { type: 'string', description: 'The dog id from list_dogs.' },
    },
    required: ['dogId'],
  },
  zod: getDogProfileInput,
  async run({ dogId }, { userId }) {
    const dogRows = await getDb()
      .select()
      .from(dogTable)
      .where(and(eq(dogTable.id, dogId), eq(dogTable.userId, userId), isNull(dogTable.archivedAt)))
      .limit(1);
    const d = dogRows[0];
    if (!d) return `No active dog with id ${dogId} owned by this user.`;

    const intakes = await getDb()
      .select()
      .from(intakeResponse)
      .where(and(eq(intakeResponse.dogId, d.id), eq(intakeResponse.userId, userId)))
      .orderBy(asc(intakeResponse.version));
    const latestIntake = intakes.at(-1);

    const dogPayload: Partial<Dog> & { ageMonths: number | null } = {
      id: d.id,
      name: d.name,
      breed: {
        kind: d.breedKind,
        ...(d.breedPrimary ? { primary: d.breedPrimary } : {}),
        ...(d.breedSecondary ? { secondary: d.breedSecondary } : {}),
        isGuess: d.breedIsGuess,
      },
      sex: d.sex,
      neuterStatus: d.neuterStatus,
      neuteredOn: d.neuteredOn ?? null,
      birthDate: d.birthDate ?? null,
      birthDateIsEstimate: d.birthDateIsEstimate,
      ageMonths: ageMonthsFrom(d.birthDate ?? null),
      weightKg: d.weightKg ?? null,
      color: d.color ?? null,
      microchip: d.microchip ?? null,
      source: d.source,
      acquiredOn: d.acquiredOn ?? null,
      acquiredAtAgeWeeks: d.acquiredAtAgeWeeks ?? null,
      notes: d.notes ?? null,
    };

    return JSON.stringify(
      {
        dog: dogPayload,
        intake:
          latestIntake !== undefined
            ? {
                version: latestIntake.version,
                createdAt: latestIntake.createdAt.toISOString(),
                answers: latestIntake.answers as IntakeResponse['answers'],
              }
            : null,
      },
      null,
      2,
    );
  },
};

// get_breed_info — by slug or by name (we'll fuzzy-slug the name).
const getBreedInfoInput = z
  .object({
    slug: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
  })
  .refine((v) => !!v.slug || !!v.name, { message: 'pass slug or name' });
const getBreedInfo: ToolDef<z.infer<typeof getBreedInfoInput>> = {
  name: 'get_breed_info',
  description:
    'Get the curated reference profile for a breed (energy, trainability, size, lifespan, grooming, health watch-list, daily exercise reality, notes). Pass slug (preferred) or name.',
  inputSchema: {
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'Library slug, e.g. belgian-malinois' },
      name: { type: 'string', description: 'Breed name (we will fuzzy-match)' },
    },
  },
  zod: getBreedInfoInput,
  async run({ slug, name }) {
    const targetSlug =
      slug ??
      (name ?? '')
        .toLowerCase()
        .trim()
        .replace(/×/g, 'x')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    const rows = await getDb()
      .select()
      .from(breedProfile)
      .where(eq(breedProfile.slug, targetSlug))
      .limit(1);
    const b = rows[0];
    if (!b) return `No breed profile in the library for "${slug ?? name}".`;
    return JSON.stringify(
      {
        slug: b.slug,
        name: b.name,
        kind: b.kind,
        groupName: b.groupName,
        bredFor: b.bredFor,
        temperament: b.temperament,
        energyLevel: b.energyLevel,
        trainability: b.trainability,
        weightKgRange: b.weightKgRange,
        heightCmRange: b.heightCmRange,
        lifespanYearsRange: b.lifespanYearsRange,
        groomingNotes: b.groomingNotes,
        healthPredispositions: b.healthPredispositions,
        dailyExerciseTarget: b.dailyExerciseTarget,
        notes: b.notes,
        parentSlugs: b.parentSlugs,
      },
      null,
      2,
    );
  },
};

// --- Registry & dispatch -------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOLS: ReadonlyArray<ToolDef<any>> = [listDogs, getDogProfile, getBreedInfo];

/** LlmTool-shaped definitions (camelCase `inputSchema`); `llm.ts` translates
 *  to the Anthropic snake_case form via `toAnthropicTool`. */
export const LLM_TOOLS = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  inputSchema: t.inputSchema,
}));

/**
 * Run a tool by name with the model's raw input. Returns `{ result, isError }` —
 * errors come back as a string the model can recover from instead of throwing.
 */
export async function runTool(
  name: string,
  input: unknown,
  ctx: { userId: string },
): Promise<{ result: string; isError: boolean }> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { result: `Unknown tool: ${name}`, isError: true };

  const parsed = tool.zod.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      result: `Invalid input for ${name}: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      isError: true,
    };
  }
  try {
    return { result: await tool.run(parsed.data, ctx), isError: false };
  } catch (err) {
    return {
      result: `Tool ${name} failed: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}

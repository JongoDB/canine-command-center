/**
 * Drizzle schema.
 *
 * Better Auth core tables (`user` / `session` / `account` / `verification`) +
 * the app's domain tables, added per milestone:
 *   - M1.1: `dog`, `intake_response`
 *   - (later) `breed_profile`, `program*`, `health_event`, … — see docs/ARCHITECTURE.md §4.
 *
 * Better Auth column names follow its default (camelCase), so its Drizzle
 * adapter binds onto them directly. The app's own tables use snake_case columns
 * (the usual Postgres convention) — Drizzle maps the camelCase TS keys.
 */
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Better Auth core
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Dogs + intake (M1.1)
// ---------------------------------------------------------------------------

export const breedKindEnum = pgEnum('breed_kind', ['pure', 'mix', 'unknown']);
export const dogSexEnum = pgEnum('dog_sex', ['male', 'female', 'unknown']);
export const neuterStatusEnum = pgEnum('neuter_status', [
  'intact',
  'neutered',
  'spayed',
  'unknown',
]);
export const dogSourceEnum = pgEnum('dog_source', [
  'breeder',
  'shelter',
  'rescue',
  'stray',
  'bred_by_me',
  'gift',
  'other',
  'unknown',
]);

// Generic media table (M1.1d) — photos for now; video / chat-image attachments
// hang off the same table later. `kind` + `storage_key` (the key in the storage
// provider) + the mime/size. EXIF stripping + thumbnails come later (with sharp).
export const mediaKindEnum = pgEnum('media_kind', ['photo', 'video']);
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  kind: mediaKindEnum('kind').notNull().default('photo'),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  /** The key under which the file lives in the storage provider. */
  storageKey: text('storage_key').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const dog = pgTable('dog', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),

  // breed
  breedKind: breedKindEnum('breed_kind').notNull().default('unknown'),
  breedPrimary: text('breed_primary'), // e.g. "Belgian Malinois" (null if unknown)
  breedSecondary: text('breed_secondary'), // for mixes, e.g. "Dutch Shepherd"
  breedIsGuess: boolean('breed_is_guess').notNull().default(false),

  /** Profile photo. */
  photoMediaId: uuid('photo_media_id').references(() => media.id, { onDelete: 'set null' }),

  // identity
  sex: dogSexEnum('sex').notNull().default('unknown'),
  neuterStatus: neuterStatusEnum('neuter_status').notNull().default('unknown'),
  neuteredOn: date('neutered_on'),
  birthDate: date('birth_date'), // DOB or estimate (see birthDateIsEstimate)
  birthDateIsEstimate: boolean('birth_date_is_estimate').notNull().default(false),
  weightKg: real('weight_kg'),
  color: text('color'),
  microchip: text('microchip'),

  // origin / history
  source: dogSourceEnum('source').notNull().default('unknown'),
  acquiredOn: date('acquired_on'),
  acquiredAtAgeWeeks: integer('acquired_at_age_weeks'),
  notes: text('notes'),

  // lifecycle
  archivedAt: timestamp('archived_at'), // soft delete
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const intakeResponse = pgTable(
  'intake_response',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dogId: uuid('dog_id')
      .notNull()
      .references(() => dog.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** 1, 2, 3 … — a new row each time intake is (re-)submitted; the highest is current. */
    version: integer('version').notNull(),
    /** The full structured intake (validated against @ccc/shared's IntakeAnswers). */
    answers: jsonb('answers').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique('intake_dog_version_unique').on(t.dogId, t.version)],
);

// ---------------------------------------------------------------------------
// Breed library (M1.2 — reference data, not user-scoped)
// ---------------------------------------------------------------------------

export const breedKindRefEnum = pgEnum('breed_profile_kind', ['pure', 'composite', 'unknown']);
export const energyLevelEnum = pgEnum('energy_level', ['low', 'moderate', 'high', 'very_high']);
export const trainabilityEnum = pgEnum('trainability', ['moderate', 'high', 'very_high']);

export const breedProfile = pgTable('breed_profile', {
  /** URL-safe slug, e.g. "belgian-malinois" or "belgian-malinois-x-dutch-shepherd". */
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  /** Pure breed, a documented composite mix, or the "unknown mix" placeholder. */
  kind: breedKindRefEnum('kind').notNull().default('pure'),
  /** Other names this breed goes by (e.g. ["Mal", "Mali"]). */
  aka: jsonb('aka').notNull().default([]),
  /** AKC/UKC group — "Herding", "Working", … (null for mixes). */
  groupName: text('group_name'),
  /** Plain-English "bred for" summary. */
  bredFor: text('bred_for'),
  /** Trait words: ["intelligent", "intense", "driven", …]. */
  temperament: jsonb('temperament').notNull().default([]),
  energyLevel: energyLevelEnum('energy_level').notNull().default('moderate'),
  trainability: trainabilityEnum('trainability').notNull().default('high'),
  /** Adult weight range in kg, e.g. { min: 25, max: 35 }. */
  weightKgRange: jsonb('weight_kg_range'),
  /** Adult shoulder height in cm, e.g. { min: 56, max: 62 }. */
  heightCmRange: jsonb('height_cm_range'),
  /** Lifespan in years, e.g. { min: 12, max: 14 }. */
  lifespanYearsRange: jsonb('lifespan_years_range'),
  groomingNotes: text('grooming_notes'),
  /** Conditions to ask the vet about (Scout cites these). */
  healthPredispositions: jsonb('health_predispositions').notNull().default([]),
  /** Daily exercise reality (plain English). */
  dailyExerciseTarget: text('daily_exercise_target'),
  /** Owner-facing prose summary. */
  notes: text('notes'),
  /** For composite mixes — the parent breed slugs. */
  parentSlugs: jsonb('parent_slugs').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// Conversations + messages (M1.3 — Scout chat)
// ---------------------------------------------------------------------------

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);

export const conversation = pgTable('conversation', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** Optional anchor — if set, Scout's context centres on this dog. */
  dogId: uuid('dog_id').references(() => dog.id, { onDelete: 'set null' }),
  title: text('title').notNull().default('New chat'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const message = pgTable('message', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversation.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  /** Plain text — multimodal content blocks come in M5.1 (image input). */
  content: text('content').notNull().default(''),
  /** Tool-use record(s) the assistant emitted on this turn (jsonb array). */
  toolCalls: jsonb('tool_calls').notNull().default([]),
  /** Token-usage tally for the LLM call that produced this row, if any. */
  usage: jsonb('usage'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type DogRow = typeof dog.$inferSelect;
export type NewDogRow = typeof dog.$inferInsert;
export type IntakeResponseRow = typeof intakeResponse.$inferSelect;
export type BreedProfileRow = typeof breedProfile.$inferSelect;
export type NewBreedProfileRow = typeof breedProfile.$inferInsert;
export type ConversationRow = typeof conversation.$inferSelect;
export type MessageRow = typeof message.$inferSelect;
export type MediaRow = typeof media.$inferSelect;
export type NewMediaRow = typeof media.$inferInsert;

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

export type User = typeof user.$inferSelect;
export type DogRow = typeof dog.$inferSelect;
export type NewDogRow = typeof dog.$inferInsert;
export type IntakeResponseRow = typeof intakeResponse.$inferSelect;

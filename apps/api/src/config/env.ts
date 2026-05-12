import 'dotenv/config';
import { z } from 'zod';

/**
 * Validated environment. `dotenv/config` (above) loads `apps/api/.env` when
 * present — that's how the dev server and `pnpm db:migrate` pick up local
 * config. In CI / production the variables come from the real environment.
 *
 * Keep this lean: add a variable here only when something actually reads it.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  /** Postgres connection string, e.g. postgres://ccc:ccc_dev@localhost:5432/ccc */
  DATABASE_URL: z.string().min(1),

  /**
   * Public origin of the API itself (for building absolute URLs, CORS, and
   * Better Auth). Defaults to http://localhost:<PORT>.
   */
  APP_BASE_URL: z.string().url().optional(),

  /**
   * Public origin of the **web client** — where verification / password-reset
   * email links should land. Defaults to the first CORS origin.
   */
  WEB_BASE_URL: z.string().url().optional(),

  /**
   * Comma-separated list of browser origins allowed to call the API (the web
   * client in dev/prod). Defaults below to common Vite dev ports.
   */
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:4173'),

  /** Better Auth signing secret. Required everywhere; never commit a real one. */
  BETTER_AUTH_SECRET: z.string().min(16, 'must be at least 16 characters'),

  // Outbound email (verification, password reset, later digests). When MAIL_HOST
  // is unset, emails are logged instead of sent (dev without mailpit). In dev,
  // point these at the mailpit container (host=localhost, port=1025).
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('Canine Command Center <no-reply@localhost>'),

  // Claude access for "Scout" — set exactly one (the OAuth token from
  // `claude setup-token` is preferred — billed to the owner's Claude
  // subscription — with the API key as fallback). Optional only so the API can
  // boot for non-chat work; the chat endpoint surfaces a friendly error if
  // neither is present.
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  /** Override the default Claude model (defaults to claude-opus-4-7). */
  ANTHROPIC_MODEL: z.string().optional(),

  /** Where uploaded media is stored by the local-fs storage provider (dev/self-host). */
  UPLOADS_DIR: z.string().default('./uploads'),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${issues}\n` +
        `(Set these in apps/api/.env for local dev — see apps/api/.env.example.)`,
    );
  }
  return parsed.data;
}

export const env: Env = loadEnv();

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDev = env.NODE_ENV === 'development';

/** Origins allowed by CORS, parsed once. */
export const corsOrigins: string[] = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Public base URL of the API, with a sensible localhost default. */
export const appBaseUrl: string = env.APP_BASE_URL ?? `http://localhost:${env.PORT}`;

/** Public base URL of the web client (where auth email links should land). */
export const webBaseUrl: string = env.WEB_BASE_URL ?? corsOrigins[0] ?? appBaseUrl;

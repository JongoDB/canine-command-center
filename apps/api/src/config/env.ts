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
   * Public origin of the API itself (for building absolute URLs, CORS, and —
   * from M0.4 — Better Auth). Defaults to http://localhost:<PORT>.
   */
  APP_BASE_URL: z.string().url().optional(),

  /**
   * Comma-separated list of browser origins allowed to call the API (the web
   * client in dev/prod). Defaults below to common Vite dev ports.
   */
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:4173'),

  // Claude access for "Scout" — wired into the SSE proxy in M1.3. Optional until
  // then; exactly one of these should be set when the chat feature ships.
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
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

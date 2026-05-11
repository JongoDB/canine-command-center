import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// `generate` (the common case) doesn't connect — it diffs the schema against
// the committed snapshot — so a placeholder URL is fine when DATABASE_URL is
// unset. `migrate`/`push`/`studio` get the real value from apps/api/.env or the
// environment.
const url = process.env.DATABASE_URL ?? 'postgres://localhost:5432/_generate_only';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});

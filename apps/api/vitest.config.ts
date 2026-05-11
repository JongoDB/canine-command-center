import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Env defaults (DATABASE_URL → unreachable unless overridden, secrets, …)
    // are applied here before any test module loads.
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    pool: 'threads',
    // DB-backed suites run serially against a shared Postgres.
    poolOptions: { threads: { singleThread: true } },
  },
});

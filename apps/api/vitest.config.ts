import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit/integration tests run without external services. DATABASE_URL points
    // at an unreachable address on purpose so `env.ts` validates but the DB
    // ping fails fast (→ db sub-status "down"). Tests that need a real Postgres
    // are gated on a service container in CI and skipped otherwise.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://ccc:ccc@127.0.0.1:1/ccc_test',
      LOG_LEVEL: 'silent',
    },
    include: ['src/**/*.test.ts'],
    // Open a real socket per pool; keep tests serial-ish to avoid port churn.
    pool: 'threads',
  },
});

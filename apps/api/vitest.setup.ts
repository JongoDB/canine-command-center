// Test-time environment defaults. Anything already set (e.g. by CI, or when you
// run `DATABASE_URL=... pnpm test` against a local Postgres) wins — these are
// only fallbacks so the non-DB tests run with zero setup.
process.env.NODE_ENV ??= 'test';
process.env.LOG_LEVEL ??= 'silent';
// Unreachable on purpose: env.ts validates, pingDb() fails fast, DB-backed
// suites (auth) detect this and skip.
process.env.DATABASE_URL ??= 'postgres://ccc:ccc@127.0.0.1:1/ccc_test';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-do-not-use-in-prod-0123456789';
// Low so the upload-quota path is testable; the per-user uploads elsewhere in
// the suite stay well under this.
process.env.MEDIA_MAX_PER_USER ??= '5';

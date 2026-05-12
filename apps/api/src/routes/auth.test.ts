import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeDb, getPool, pingDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { sentEmails } from '../lib/email';
import { buildServer } from '../server';

// DB-backed. Runs only when DATABASE_URL points at a reachable Postgres — that's
// CI (the postgres service) or a local `DATABASE_URL=... pnpm test` with
// `pnpm db:up` running. Otherwise the suite is skipped (the rest of the API
// tests don't need a DB).
const dbReachable = await pingDb(2500);
const suite = dbReachable ? describe : describe.skip;

if (!dbReachable) {
  console.warn('[auth.test] DATABASE_URL not reachable — skipping DB-backed auth tests');
}

/** Pull `name=value` pairs out of a Set-Cookie header (string or array). */
function cookieHeader(setCookie: string | string[] | undefined): string {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return list
    .map((c) => c.split(';', 1)[0]?.trim())
    .filter((v): v is string => Boolean(v))
    .join('; ');
}

suite('Auth (email/password) — sign-up → verify → sign-in → /me → sign-out', () => {
  let app: FastifyInstance;
  const email = `t-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const password = 'correct-horse-battery-staple';

  beforeAll(async () => {
    await applyMigrations(); // idempotent — ensure the schema exists
    // Clean slate for the tables this suite touches.
    await getPool().query('TRUNCATE TABLE "session", "account", "verification", "user" CASCADE');
    sentEmails.length = 0;
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it('sign-up creates the user and sends a verification email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { email, password, name: 'Test Handler' },
    });
    expect(res.statusCode).toBe(200);
    expect(sentEmails.some((m) => m.to === email && /verify/i.test(m.subject))).toBe(true);
  });

  it('sign-in is refused until the email is verified', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email, password },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('verifying with the email code works, then sign-in succeeds and /me returns the user', async () => {
    const verifyEmail = sentEmails.find((m) => m.to === email && /verify/i.test(m.subject));
    expect(verifyEmail).toBeDefined();
    const otp = /\b(\d{6})\b/.exec(verifyEmail!.text)?.[1];
    expect(otp, '6-digit verification code in the email body').toBeTruthy();

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/email-otp/verify-email',
      payload: { email, otp },
    });
    expect(verifyRes.statusCode).toBe(200);

    const signInRes = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email, password },
    });
    expect(signInRes.statusCode).toBe(200);
    const cookie = cookieHeader(signInRes.headers['set-cookie']);
    expect(cookie).toContain('session');

    const meRes = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(meRes.statusCode).toBe(200);
    const me = meRes.json() as { email: string; emailVerified: boolean; id: string };
    expect(me.email).toBe(email);
    expect(me.emailVerified).toBe(true);
    expect(me.id).toBeTruthy();

    // No cookie → 401.
    const unauth = await app.inject({ method: 'GET', url: '/me' });
    expect(unauth.statusCode).toBe(401);

    // Sign out, then the cookie no longer works.
    const signOut = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      headers: { cookie },
    });
    expect(signOut.statusCode).toBe(200);
    const afterSignOut = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(afterSignOut.statusCode).toBe(401);
  });

  it('password-reset request is accepted and emails a reset link', async () => {
    sentEmails.length = 0;
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/request-password-reset',
      payload: { email, redirectTo: 'http://localhost:4000/reset-password' },
    });
    // Better Auth returns 200 regardless of whether the address exists (no
    // account enumeration); for a known address it emails the reset link.
    expect(res.statusCode).toBe(200);
    expect(sentEmails.some((m) => m.to === email && /reset/i.test(m.subject))).toBe(true);
  });
});

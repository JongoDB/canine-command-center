import type { FastifyInstance } from 'fastify';
import { sentEmails } from './lib/email';

/** Pull the `name=value` pairs out of a Set-Cookie header (string or array). */
export function cookieHeaderFrom(setCookie: string | string[] | undefined): string {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return list
    .map((c) => c.split(';', 1)[0]?.trim())
    .filter((v): v is string => Boolean(v))
    .join('; ');
}

export interface TestUser {
  id: string;
  email: string;
  /** Cookie header value to send on authenticated requests. */
  cookie: string;
}

/**
 * Sign up a fresh user, verify the email (with the 6-digit code from the
 * captured verification email), and sign in — returns the user id/email and the
 * session cookie. For DB-backed tests that need an authenticated request.
 */
export async function createTestUser(app: FastifyInstance, name = 'Test User'): Promise<TestUser> {
  const email = `t-${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}@example.test`;
  const password = 'correct-horse-battery-staple';

  const before = sentEmails.length;
  const signUp = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: { email, password, name },
  });
  if (signUp.statusCode !== 200)
    throw new Error(`sign-up failed: ${signUp.statusCode} ${signUp.body}`);

  const verifyMail = sentEmails
    .slice(before)
    .find((m) => m.to === email && /verify/i.test(m.subject));
  const otp = verifyMail ? /\b(\d{6})\b/.exec(verifyMail.text)?.[1] : undefined;
  if (!otp) throw new Error('no verification code in the captured email');
  const verifyRes = await app.inject({
    method: 'POST',
    url: '/api/auth/email-otp/verify-email',
    payload: { email, otp },
  });
  if (verifyRes.statusCode !== 200)
    throw new Error(`email verification failed: ${verifyRes.statusCode} ${verifyRes.body}`);

  const signIn = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    payload: { email, password },
  });
  if (signIn.statusCode !== 200)
    throw new Error(`sign-in failed: ${signIn.statusCode} ${signIn.body}`);
  const cookie = cookieHeaderFrom(signIn.headers['set-cookie']);

  const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
  if (me.statusCode !== 200) throw new Error(`/me failed: ${me.statusCode} ${me.body}`);
  const id = (me.json() as { id: string }).id;

  return { id, email, cookie };
}

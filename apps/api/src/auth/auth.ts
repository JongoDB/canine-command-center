import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { BRANDING } from '@ccc/shared';
import { appBaseUrl, corsOrigins, env, isProd } from '../config/env';
import { getDb } from '../db/client';
import * as schema from '../db/schema';
import { sendEmail } from '../lib/email';

/**
 * Better Auth instance. Email/password with email verification and password
 * reset; sessions are cookie-based (the web client) — bearer-token support for
 * the mobile client is added with the Expo plugin in M0.6. The Drizzle adapter
 * maps onto the `user` / `session` / `account` / `verification` tables defined
 * in src/db/schema.ts (camelCase columns match Better Auth's defaults, so no
 * field-name overrides are needed).
 */
export const auth = betterAuth({
  appName: BRANDING.appName,
  baseURL: appBaseUrl,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: Array.from(new Set([appBaseUrl, ...corsOrigins])),

  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Reset your ${BRANDING.appName} password`,
        text: `Reset your password:\n\n${url}\n\nIf you didn't request this, you can ignore this email.`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Verify your email for ${BRANDING.appName}`,
        text: `Welcome to ${BRANDING.appName}! Confirm your email address:\n\n${url}`,
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh the cookie at most once a day
  },

  advanced: {
    // The web client may run on a different origin in dev — keep cookies usable
    // there; only mark them Secure in production (HTTPS).
    defaultCookieAttributes: { sameSite: 'lax', secure: isProd },
  },
});

export type Auth = typeof auth;
export type SessionUser = Auth['$Infer']['Session']['user'];
export type AuthSession = Auth['$Infer']['Session']['session'];

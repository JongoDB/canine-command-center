import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { BRANDING } from '@ccc/shared';
import { appBaseUrl, corsOrigins, env, isProd, webBaseUrl } from '../config/env';
import { getDb } from '../db/client';
import * as schema from '../db/schema';
import { sendEmail } from '../lib/email';

/** Build a link into the web client (verification / password-reset land there). */
function webLink(path: string, token: string): string {
  return `${webBaseUrl}${path}?token=${encodeURIComponent(token)}`;
}

/** How long an email-verification code stays valid. */
const EMAIL_OTP_TTL_SECONDS = 60 * 10;

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
    sendResetPassword: async ({ user, token }) => {
      await sendEmail({
        to: user.email,
        subject: `Reset your ${BRANDING.appName} password`,
        text:
          `Reset your password:\n\n${webLink('/reset-password', token)}\n\n` +
          `If you didn't request this, you can safely ignore this email.`,
      });
    },
  },

  // Email verification is OTP-based (the `emailOTP` plugin below sends the
  // code on sign-up). This magic-link sender is kept for any explicit re-send
  // of a link, but `sendOnSignUp` is off so it's dormant by default.
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      await sendEmail({
        to: user.email,
        subject: `Verify your email for ${BRANDING.appName}`,
        text: `Confirm your email address for ${BRANDING.appName}:\n\n${webLink('/verify-email', token)}`,
      });
    },
  },

  plugins: [
    // 6-digit email-verification code, sent on sign-up. The email also carries
    // a link that pre-fills the code (`/verify-email?email=…&code=…`) so the
    // owner can either click it or type the code on another device/browser.
    emailOTP({
      otpLength: 6,
      expiresIn: EMAIL_OTP_TTL_SECONDS,
      sendVerificationOnSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const linkSuffix =
          type === 'email-verification'
            ? `\n\nOr open this link to verify here:\n${webBaseUrl}/verify-email?email=${encodeURIComponent(email)}&code=${otp}`
            : '';
        await sendEmail({
          to: email,
          subject: `Verify your email for ${BRANDING.appName}`,
          text:
            `Your ${BRANDING.appName} verification code is:\n\n    ${otp}\n\n` +
            `Enter it on the verification screen.${linkSuffix}\n\n` +
            `This code expires in ${EMAIL_OTP_TTL_SECONDS / 60} minutes. If you didn't sign up, you can ignore this email.`,
        });
      },
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh the cookie at most once a day
  },

  // Let an authenticated user delete their account + all their data (the dog /
  // intake / conversation / message rows cascade via FKs). No email
  // confirmation step for v1 — a fresh password challenge is enough; M6 hardens.
  user: {
    deleteUser: { enabled: true },
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

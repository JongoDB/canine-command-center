import nodemailer, { type Transporter } from 'nodemailer';
import { env, isTest } from '../config/env';

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * In tests, sent emails are captured here instead of dispatched, so assertions
 * can read verification / password-reset links. Cleared between tests as needed.
 */
export const sentEmails: OutboundEmail[] = [];

let transporter: Transporter | undefined;

function getTransporter(): Transporter | undefined {
  if (!env.MAIL_HOST) return undefined;
  transporter ??= nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE,
    ...(env.MAIL_USER ? { auth: { user: env.MAIL_USER, pass: env.MAIL_PASSWORD ?? '' } } : {}),
  });
  return transporter;
}

/** Send (or, in tests, capture) a transactional email. Best-effort by design. */
export async function sendEmail(msg: OutboundEmail): Promise<void> {
  if (isTest) {
    sentEmails.push(msg);
    return;
  }
  const t = getTransporter();
  if (!t) {
    // No SMTP configured — log it (dev without mailpit). Better than failing
    // the auth flow over a missing dev convenience.
    console.warn(
      `[email] not sent (MAIL_HOST unset) → to=${msg.to} subject=${JSON.stringify(msg.subject)}\n${msg.text}`,
    );
    return;
  }
  await t.sendMail({
    from: env.MAIL_FROM,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    ...(msg.html ? { html: msg.html } : {}),
  });
}

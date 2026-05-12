// Headless-browser smoke test for the web app. Loads every route in a real
// Chromium, fails on any console error / page error / unhandled rejection, and
// walks the core authed flow (sign up → verify via mailpit → onboard stepper →
// dog profile → Scout → breeds → settings).
//
//   node scripts/smoke-web.mjs            # against http://localhost:5173 (+ mailpit :8025)
//   SMOKE_BASE_URL=… MAILPIT_URL=… node scripts/smoke-web.mjs
//
// Requires the dev stack running (pnpm db:up; pnpm dev:api; pnpm dev:web) and
// `playwright` + Chromium installed (`pnpm exec playwright install chromium`).
import { chromium } from 'playwright';

const BASE = (process.env.SMOKE_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const MAILPIT = (process.env.MAILPIT_URL ?? 'http://localhost:8025').replace(/\/$/, '');

let failures = 0;
const log = (...a) => console.log(...a);
const pass = (name) => log(`  ✓ ${name}`);
const fail = (name, why) => {
  failures += 1;
  log(`  ✗ ${name} — ${why}`);
};

/** Run `fn` with a fresh page that records console/page errors; report under `name`. */
// Console errors that aren't app bugs: a failed-resource log for an expected
// auth rejection (401/403 on a session-gated endpoint when logged out) or the
// Scout LLM-quota 429, and Vite/React dev chatter.
const BENIGN_CONSOLE =
  /Failed to load resource.*status of (401|403|429)|Download the React DevTools|\[vite\]/i;

async function withPage(context, name, fn) {
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(20000);
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !BENIGN_CONSOLE.test(m.text()))
      errors.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const u = r.url();
    // Ignore the implicit /favicon.ico probe and aborted nav requests.
    if (u.endsWith('/favicon.ico') || r.failure()?.errorText === 'net::ERR_ABORTED') return;
    errors.push(`requestfailed: ${u} (${r.failure()?.errorText})`);
  });
  try {
    await fn(page, errors);
    if (errors.length) fail(name, errors.join(' | '));
    else pass(name);
  } catch (e) {
    fail(name, `${e.message}${errors.length ? ' | ' + errors.join(' | ') : ''}`);
  } finally {
    await page.close();
  }
}

/** Navigate + wait for the SPA to actually render something. */
async function goTo(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return !!root && root.children.length > 0 && document.body.innerText.trim().length > 0;
  });
}

/** Wait for + return the latest message's body text from mailpit (polls ~15s). */
async function latestEmailText() {
  for (let i = 0; i < 30; i += 1) {
    const list = await fetch(`${MAILPIT}/api/v1/messages?limit=1`).then((r) => r.json());
    const id = list.messages?.[0]?.ID;
    if (id) {
      const msg = await fetch(`${MAILPIT}/api/v1/message/${id}`).then((r) => r.json());
      return msg.Text ?? msg.HTML ?? '';
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('no email arrived in mailpit within 15s');
}

async function main() {
  log(`smoke-web → ${BASE}  (mailpit ${MAILPIT})`);
  // Sanity: dev server reachable.
  const head = await fetch(BASE)
    .then((r) => r.status)
    .catch(() => 0);
  if (head !== 200) {
    log(`✗ web dev server not reachable at ${BASE} (status ${head})`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  // ── public routes (no auth) ──────────────────────────────────────────────
  log('\nPublic routes:');
  {
    const ctx = await browser.newContext();
    for (const p of ['/sign-in', '/sign-up', '/forgot-password', '/reset-password?token=x']) {
      await withPage(ctx, `GET ${p}`, async (page) => {
        await goTo(page, p);
      });
    }
    // Auth-gated routes should bounce to /sign-in (not crash) when logged out.
    for (const p of ['/', '/onboard', '/scout', '/settings', '/breeds', '/dogs/abc']) {
      await withPage(ctx, `GET ${p} (→ sign-in when logged out)`, async (page) => {
        await page.goto(`${BASE}${p}`, { waitUntil: 'load' });
        await page.waitForURL(/\/sign-in$/).catch(() => {});
        const path = new URL(page.url()).pathname;
        if (path !== '/sign-in') throw new Error(`expected redirect to /sign-in, got ${path}`);
        await page.waitForFunction(() => document.body.innerText.trim().length > 0);
      });
    }
    await ctx.close();
  }

  // ── full authed flow ─────────────────────────────────────────────────────
  log('\nAuthed flow:');
  const ctx = await browser.newContext();
  const email = `smoke+${Date.now()}@example.test`;
  const password = 'smoke-pass-12345';
  let dogId = null;

  await withPage(ctx, 'sign up', async (page) => {
    await goTo(page, '/sign-up');
    await page.getByLabel(/your name/i).fill('Smoke Tester');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /create account/i }).click();
    // Success → "Check your email" screen.
    await page.getByText(/check your email/i).waitFor();
  });

  // (a) The /verify-email SPA screen mounts cleanly (it then hops to the API;
  //     a bogus token just gets rejected → no uncaught error).
  await withPage(ctx, '/verify-email screen renders', async (page) => {
    await page.goto(`${BASE}/verify-email?token=not-a-real-token`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.innerText.trim().length > 0);
    await page.waitForTimeout(2500); // settle the location.replace + API round-trip
  });

  // (b) Actually verify + establish the session via the API's GET endpoint
  //     (exactly what the SPA navigates to) → lands on /onboard for a fresh user.
  await withPage(ctx, 'verify email → authed onboard', async (page) => {
    const text = await latestEmailText();
    const m = text.match(/[?&]token=([^\s&"'<>)]+)/);
    if (!m) throw new Error(`no verify token in email; body was: ${text.slice(0, 200)}`);
    await page.goto(
      `${BASE}/api/auth/verify-email?token=${encodeURIComponent(m[1])}&callbackURL=${encodeURIComponent(`${BASE}/`)}`,
      { waitUntil: 'load' },
    );
    // → /  → (session resolves, 0 dogs) → /onboard. Wait for that terminal state.
    await page
      .waitForURL((url) => ['/onboard', '/sign-in'].includes(new URL(url).pathname), {
        timeout: 25000,
      })
      .catch(() => {});
    const path = new URL(page.url()).pathname;
    if (path !== '/onboard') {
      const cookies = (await page.context().cookies()).map((c) => c.name).join(',') || '(none)';
      throw new Error(
        `expected /onboard after verify, got ${path}. cookies=[${cookies}]. page text: ${(await page.evaluate(() => document.body.innerText)).slice(0, 160).replace(/\s+/g, ' ')}`,
      );
    }
  });

  await withPage(ctx, 'onboard stepper → meet Scout', async (page) => {
    await goTo(page, '/onboard');
    // The default example pre-fills Section A (name "Sentry"). Step through
    // B–E with "Next", then the final submit.
    for (let i = 0; i < 8; i += 1) {
      const submit = page.getByRole('button', { name: /build this dog.?s plan/i }); // apostrophe may be curly
      if (await submit.count()) {
        await submit.click();
        break;
      }
      const next = page.getByRole('button', { name: /^next$/i });
      if (!(await next.count()))
        throw new Error(`stuck on intake step ${i + 1} — no Next/submit button`);
      await next.click();
      await page.waitForTimeout(300);
    }
    await page.waitForURL(/\/scout\//);
    await page.waitForFunction(() => document.body.innerText.trim().length > 0);
  });

  await withPage(ctx, 'home (now has a dog)', async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    // Either a dog link appears (good) or we get bounced to /onboard (no dog) /
    // /sign-in (lost session).
    await page
      .waitForFunction(
        () =>
          !!document.querySelector('a[href^="/dogs/"]') ||
          ['/onboard', '/sign-in'].includes(location.pathname),
        { timeout: 12000 },
      )
      .catch(() => {});
    const path = new URL(page.url()).pathname;
    if (path === '/sign-in') throw new Error('bounced to /sign-in (lost session)');
    if (path === '/onboard') throw new Error('redirected to /onboard — the dog was not created');
    const href = await page
      .locator('a[href^="/dogs/"]')
      .first()
      .getAttribute('href')
      .catch(() => null);
    if (!href) throw new Error('no dog link on /');
    dogId = href.split('/dogs/')[1]?.split(/[/?#]/)[0] ?? null;
  });

  for (const route of [
    () => '/scout',
    () => '/breeds',
    () => '/breeds/border-collie',
    () => '/settings',
    () => (dogId ? `/dogs/${dogId}` : null),
    () => (dogId ? `/dogs/${dogId}/edit` : null),
  ]) {
    const p = route();
    if (!p) continue;
    await withPage(ctx, `GET ${p} (authed)`, async (page) => {
      await goTo(page, p);
      const path = new URL(page.url()).pathname;
      if (path === '/sign-in') throw new Error('bounced to /sign-in (lost session)');
    });
  }

  await ctx.close();
  await browser.close();

  log(`\n${failures === 0 ? '✓ all checks passed' : `✗ ${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('smoke-web crashed:', e);
  process.exit(1);
});

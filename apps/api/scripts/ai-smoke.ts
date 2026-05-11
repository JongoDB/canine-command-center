/**
 * Manual smoke test for the Claude integration.
 *
 *   pnpm --filter @ccc/api ai:smoke
 *
 * Reads ANTHROPIC_AUTH_TOKEN (or ANTHROPIC_API_KEY) from apps/api/.env, builds
 * the persona system prompt, and streams a single Scout reply for an
 * imagined Mal × Dutch Shepherd. Hits the live Anthropic API — burns tokens.
 * Not run in CI.
 */
import 'dotenv/config';
import { hasClaudeCredentials, streamMessage } from '../src/ai/llm';
import { systemPrompt } from '../src/ai/persona';

const exampleContext = `## Currently focused dog
- name: Sentry
- breed: Belgian Malinois × Dutch Shepherd mix (guess)
- sex: female
- birth date: 2025-12-01 — 5 months total
- source: breeder

## Latest intake (v1)
- living: { homeType: 'house', ownerActivityLevel: 'high', ownerDogExperience: 'experienced' }
- goals: { focusAreas: ['off-leash recall', 'calm settle'], minutesPerDay: 90 }`;

async function main(): Promise<void> {
  if (!hasClaudeCredentials()) {
    console.error(
      'No Claude credentials. Set ANTHROPIC_AUTH_TOKEN (preferred — from `claude setup-token`) or ANTHROPIC_API_KEY in apps/api/.env.',
    );
    process.exit(1);
  }

  const system = systemPrompt({ contextText: exampleContext });
  console.log('--- system prompt (first 400 chars) ---');
  console.log(system.slice(0, 400) + '…');
  console.log(`--- system prompt total length: ${system.length} chars ---\n`);
  console.log('--- streaming reply ---');

  let usage: Record<string, number> | null = null;
  let stopReason: string | undefined;
  for await (const ev of streamMessage({
    system,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Hi Scout — what should I work on this week with my 5-month-old Mal × Dutch Shepherd Sentry? She knows her name and a sit. We are home a lot together.',
          },
        ],
      },
    ],
  })) {
    if (ev.type === 'text_delta') process.stdout.write(ev.text);
    else if (ev.type === 'tool_use_start') console.log(`\n[tool_use_start: ${ev.name}]`);
    else if (ev.type === 'tool_use_end') console.log(`\n[tool_use_end: ${ev.id}]`);
    else if (ev.type === 'message_stop') stopReason = ev.stopReason;
    else if (ev.type === 'usage') usage = ev.usage as Record<string, number>;
    else if (ev.type === 'error') console.error(`\n[error: ${ev.message}]`);
  }

  console.log(`\n\n--- stop_reason: ${stopReason ?? '(none)'} ---`);
  if (usage) console.log(`--- usage: ${JSON.stringify(usage)} ---`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

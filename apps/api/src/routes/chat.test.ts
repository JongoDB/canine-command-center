import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { ChatEvent, Conversation, ConversationWithMessages, Dog } from '@ccc/shared';
import type { LlmStreamEvent, LlmStreamRequest } from '../ai/llm';
import { closeDb, getPool, pingDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { buildServer } from '../server';
import { createTestUser, type TestUser } from '../test-helpers';

const dbReachable = await pingDb(2500);
const suite = dbReachable ? describe : describe.skip;
if (!dbReachable) {
  console.warn('[chat.test] DATABASE_URL not reachable — skipping DB-backed chat tests');
}

/** Parse all `data: …` SSE frames out of a response body string. */
function parseEvents(body: string): ChatEvent[] {
  return body
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter((c) => c.startsWith('data:'))
    .map((c) => JSON.parse(c.slice(5).trim()) as ChatEvent);
}

/** Yields the LLM events sequentially. */
async function* fromArray(events: LlmStreamEvent[]): AsyncIterable<LlmStreamEvent> {
  for (const e of events) yield e;
}

interface FakeLlmCall {
  request: LlmStreamRequest;
}

/**
 * Build a fake LLM that returns canned responses turn-by-turn (one entry per
 * call into `streamMessage`), and records each request the orchestrator sent.
 */
function makeFakeLlm(turns: LlmStreamEvent[][]) {
  const calls: FakeLlmCall[] = [];
  let idx = 0;
  const fn = (req: LlmStreamRequest): AsyncIterable<LlmStreamEvent> => {
    calls.push({ request: JSON.parse(JSON.stringify(req)) as LlmStreamRequest });
    const events = turns[idx] ?? [
      { type: 'text_delta' as const, text: '(no canned reply)' },
      { type: 'message_stop' as const, stopReason: 'end_turn' as const },
    ];
    idx += 1;
    return fromArray(events);
  };
  return { fn, calls };
}

suite('Chat API — conversations + SSE turn (mocked LLM)', () => {
  let app: FastifyInstance;
  let user: TestUser;
  let dog: Dog;

  beforeAll(async () => {
    await applyMigrations();
    await getPool().query(
      'TRUNCATE TABLE "message", "conversation", "intake_response", "dog", "session", "account", "verification", "user" CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it('rejects unauthenticated chat requests', async () => {
    // Bring up a no-LLM server just for the auth check.
    app = await buildServer();
    await app.ready();
    expect((await app.inject({ method: 'POST', url: '/v1/conversations' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/v1/conversations' })).statusCode).toBe(401);
    await app.close();
  });

  it('runs a single-turn chat end-to-end through SSE (text only)', async () => {
    const fake = makeFakeLlm([
      [
        { type: 'text_delta', text: 'Hi! ' },
        { type: 'text_delta', text: 'How can I help with your dog?' },
        { type: 'usage', usage: { inputTokens: 100, outputTokens: 12 } },
        { type: 'message_stop', stopReason: 'end_turn' },
      ],
    ]);
    app = await buildServer({ llm: fake.fn });
    await app.ready();
    user = await createTestUser(app, 'Chat Tester');

    // Create a dog so we can anchor a conversation to it.
    const dogRes = await app.inject({
      method: 'POST',
      url: '/dogs',
      headers: { cookie: user.cookie },
      payload: {
        name: 'Sentry',
        breed: {
          kind: 'mix',
          primary: 'Belgian Malinois',
          secondary: 'Dutch Shepherd',
          isGuess: true,
        },
        sex: 'female',
      },
    });
    dog = (dogRes.json() as { dog: Dog }).dog;

    const convoRes = await app.inject({
      method: 'POST',
      url: '/v1/conversations',
      headers: { cookie: user.cookie },
      payload: { dogId: dog.id },
    });
    expect(convoRes.statusCode).toBe(201);
    const convo = (convoRes.json() as { conversation: Conversation }).conversation;
    expect(convo.dogId).toBe(dog.id);

    const sse = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${convo.id}/messages`,
      headers: { cookie: user.cookie, accept: 'text/event-stream' },
      payload: { text: 'What should I work on this week with Sentry?' },
    });
    expect(sse.statusCode).toBe(200);
    const events = parseEvents(sse.body);
    const types = events.map((e) => e.type);
    expect(types).toContain('user_message_persisted');
    expect(types).toContain('assistant_message_start');
    expect(types).toContain('text_delta');
    expect(types).toContain('assistant_message_persisted');
    expect(types).toContain('done');

    const text = events
      .filter((e): e is Extract<ChatEvent, { type: 'text_delta' }> => e.type === 'text_delta')
      .map((e) => e.text)
      .join('');
    expect(text).toBe('Hi! How can I help with your dog?');

    // The persona system prompt + per-conversation context were assembled and sent.
    expect(fake.calls).toHaveLength(1);
    const sys = fake.calls[0]!.request.system;
    expect(sys).toContain('Scout');
    expect(sys).toContain('Sentry'); // anchored dog appears in the context block
    expect(sys).toContain('Belgian Malinois'); // breed-library entry pulled in
    expect(fake.calls[0]!.request.messages).toEqual([
      {
        role: 'user',
        content: [{ type: 'text', text: 'What should I work on this week with Sentry?' }],
      },
    ]);

    // Persisted: user + assistant rows.
    const fetched = await app.inject({
      method: 'GET',
      url: `/v1/conversations/${convo.id}`,
      headers: { cookie: user.cookie },
    });
    const full = (fetched.json() as { conversation: ConversationWithMessages }).conversation;
    expect(full.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(full.messages[1]!.content).toBe('Hi! How can I help with your dog?');
    expect(full.messages[1]!.usage?.outputTokens).toBe(12);
    expect(full.title).toMatch(/sentry/i);
    await app.close();
  });

  it('runs a tool-use round-trip (assistant → list_dogs → text answer)', async () => {
    const fake = makeFakeLlm([
      // Turn 1 — model asks for the tool, no text yet.
      [
        { type: 'tool_use_start', id: 'tu_1', name: 'list_dogs' },
        { type: 'tool_use_input_delta', id: 'tu_1', partialJson: '{}' },
        { type: 'tool_use_end', id: 'tu_1' },
        { type: 'message_stop', stopReason: 'tool_use' },
      ],
      // Turn 2 — model has the tool result, produces a text answer.
      [
        { type: 'text_delta', text: 'You have one dog: Sentry.' },
        { type: 'message_stop', stopReason: 'end_turn' },
      ],
    ]);
    app = await buildServer({ llm: fake.fn });
    await app.ready();
    user = await createTestUser(app, 'Tools Tester');

    await app.inject({
      method: 'POST',
      url: '/dogs',
      headers: { cookie: user.cookie },
      payload: {
        name: 'Sentry',
        breed: { kind: 'pure', primary: 'Belgian Malinois' },
        sex: 'female',
      },
    });
    const convo = (
      (
        await app.inject({
          method: 'POST',
          url: '/v1/conversations',
          headers: { cookie: user.cookie },
          payload: {},
        })
      ).json() as { conversation: Conversation }
    ).conversation;

    const sse = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${convo.id}/messages`,
      headers: { cookie: user.cookie, accept: 'text/event-stream' },
      payload: { text: 'How many dogs do I have?' },
    });
    const events = parseEvents(sse.body);
    const types = events.map((e) => e.type);
    expect(types).toContain('tool_use_start');
    expect(types).toContain('tool_use_input');
    expect(types).toContain('tool_result');
    expect(types).toContain('text_delta');
    expect(types).toContain('done');

    const toolResult = events.find(
      (e): e is Extract<ChatEvent, { type: 'tool_result' }> => e.type === 'tool_result',
    );
    expect(toolResult).toBeTruthy();
    expect(toolResult!.isError).toBe(false);
    expect(toolResult!.result).toContain('Sentry');

    // Two LLM calls (one tool round-trip), and the second received the tool_result in its message history.
    expect(fake.calls).toHaveLength(2);
    const secondMessages = fake.calls[1]!.request.messages;
    const lastUser = secondMessages.at(-1);
    expect(lastUser?.role).toBe('user');
    expect(lastUser?.content[0]?.type).toBe('tool_result');
    await app.close();
  });

  it('returns 503 when chat is requested without Claude credentials', async () => {
    // Build the server with NO llm injection AND clear credentials env for this run.
    const savedToken = process.env.ANTHROPIC_AUTH_TOKEN;
    const savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    delete process.env.ANTHROPIC_API_KEY;

    app = await buildServer();
    await app.ready();
    user = await createTestUser(app, 'No Credentials');
    const convo = (
      (
        await app.inject({
          method: 'POST',
          url: '/v1/conversations',
          headers: { cookie: user.cookie },
          payload: {},
        })
      ).json() as { conversation: Conversation }
    ).conversation;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${convo.id}/messages`,
      headers: { cookie: user.cookie },
      payload: { text: 'hi' },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { error: { code: string } }).error.code).toBe('NO_LLM_CREDENTIALS');

    if (savedToken !== undefined) process.env.ANTHROPIC_AUTH_TOKEN = savedToken;
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
    await app.close();
  });
});

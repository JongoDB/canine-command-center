import { asc, eq } from 'drizzle-orm';
import type { ChatEvent, Message, MessageRole, MessageUsage, ToolCallRecord } from '@ccc/shared';
import { getDb } from '../db/client';
import { conversation, message, type MessageRow } from '../db/schema';
import { buildContext } from './context';
import {
  type LlmContentBlock,
  type LlmMessage,
  type LlmStreamFn,
  streamMessage as defaultStreamMessage,
} from './llm';
import { systemPrompt } from './persona';
import { LLM_TOOLS, runTool } from './tools';

const MAX_TOOL_ITERATIONS = 6;

interface RunTurnInput {
  userId: string;
  conversationId: string;
  /** The dog the conversation is anchored to (null = no anchor). */
  anchorDogId: string | null;
  /** The user's new message text. */
  userText: string;
  /** Optional dependency injection for tests. */
  llm?: LlmStreamFn;
}

/**
 * One full chat turn end-to-end:
 *   - persist the user's incoming message,
 *   - build the system prompt + per-conversation context,
 *   - call Claude in a tool-use loop, streaming events to the SSE response and
 *     persisting each assistant turn (text + tool_calls + token usage).
 *
 * Yielded events are the wire-shape `ChatEvent` from @ccc/shared.
 */
export async function* runTurn(input: RunTurnInput): AsyncGenerator<ChatEvent, void, unknown> {
  const llmStream = input.llm ?? defaultStreamMessage;
  const db = getDb();

  // 1) Persist the user message.
  const userRow = await persistMessage({
    conversationId: input.conversationId,
    userId: input.userId,
    role: 'user',
    content: input.userText,
    toolCalls: [],
    usage: null,
  });
  yield { type: 'user_message_persisted', message: toMessage(userRow) };

  // 2) Bump the conversation's updatedAt + auto-title from the first user message if still default.
  await db
    .update(conversation)
    .set({
      updatedAt: new Date(),
      ...(input.userText && (await isDefaultTitle(input.conversationId))
        ? { title: deriveTitle(input.userText) }
        : {}),
    })
    .where(eq(conversation.id, input.conversationId));

  // 3) Build the persona system prompt (with this turn's context block).
  const contextText = await buildContext({ userId: input.userId, anchorDogId: input.anchorDogId });
  const system = systemPrompt({ contextText });

  // 4) Reconstruct messages history (every persisted user/assistant turn so far)
  //    in the LLM message shape — including any tool_use & tool_result blocks.
  const llmMessages: LlmMessage[] = await loadHistoryAsLlm(input.conversationId);

  // 5) Tool-use loop.
  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter += 1) {
    let assistantText = '';
    const toolCalls: ToolCallRecord[] = [];
    let stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | undefined;
    let usage: MessageUsage | null = null;
    // tool_use blocks under construction (input JSON arrives as deltas).
    const buildingTools = new Map<string, { name: string; input: string }>();

    yield { type: 'assistant_message_start', messageId: 'pending' };

    let errored = false;
    for await (const ev of llmStream({
      system,
      messages: llmMessages,
      tools: LLM_TOOLS,
    })) {
      if (ev.type === 'text_delta') {
        assistantText += ev.text;
        yield { type: 'text_delta', text: ev.text };
      } else if (ev.type === 'tool_use_start') {
        buildingTools.set(ev.id, { name: ev.name, input: '' });
        yield { type: 'tool_use_start', id: ev.id, name: ev.name };
      } else if (ev.type === 'tool_use_input_delta') {
        const b = buildingTools.get(ev.id);
        if (b) b.input += ev.partialJson;
      } else if (ev.type === 'tool_use_end') {
        const b = buildingTools.get(ev.id);
        if (b) {
          let parsed: unknown;
          try {
            parsed = b.input ? JSON.parse(b.input) : {};
          } catch {
            parsed = { __invalid__: b.input };
          }
          toolCalls.push({ id: ev.id, name: b.name, input: parsed, result: '' });
          yield { type: 'tool_use_input', id: ev.id, input: parsed };
        }
      } else if (ev.type === 'message_stop') {
        stopReason = ev.stopReason;
      } else if (ev.type === 'usage') {
        usage = { ...(usage ?? {}), ...ev.usage };
      } else if (ev.type === 'error') {
        errored = true;
        yield { type: 'error', message: ev.message };
      }
    }

    // 5a) Build the assistant content block array (text first, then tool_use entries).
    const assistantBlocks: LlmContentBlock[] = [];
    if (assistantText) assistantBlocks.push({ type: 'text', text: assistantText });
    for (const t of toolCalls) {
      assistantBlocks.push({ type: 'tool_use', id: t.id, name: t.name, input: t.input });
    }

    // 5b) Persist the assistant message — even if there were tool_calls (the result is appended below).
    if (assistantBlocks.length > 0 || errored) {
      const row = await persistMessage({
        conversationId: input.conversationId,
        userId: input.userId,
        role: 'assistant',
        content: assistantText,
        toolCalls,
        usage,
      });
      yield { type: 'assistant_message_persisted', message: toMessage(row) };
      llmMessages.push({ role: 'assistant', content: assistantBlocks });
    }

    if (errored) break;

    // 5c) If the model called tools, run them, append tool_result blocks, and loop.
    if (stopReason === 'tool_use' && toolCalls.length > 0) {
      const toolResultBlocks: LlmContentBlock[] = [];
      for (const t of toolCalls) {
        const res = await runTool(t.name, t.input, { userId: input.userId });
        t.result = res.result;
        t.isError = res.isError;
        yield { type: 'tool_result', id: t.id, result: res.result, isError: res.isError };
        toolResultBlocks.push({
          type: 'tool_result',
          toolUseId: t.id,
          content: res.result,
          ...(res.isError ? { isError: true } : {}),
        });
      }
      llmMessages.push({ role: 'user', content: toolResultBlocks });
      continue; // ask Claude again with the tool results in hand
    }

    // 5d) end_turn / max_tokens / stop_sequence — we're done.
    break;
  }

  yield { type: 'done' };
}

// --- helpers -------------------------------------------------------------

async function persistMessage(input: {
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  toolCalls: ToolCallRecord[];
  usage: MessageUsage | null;
}): Promise<MessageRow> {
  const [row] = await getDb()
    .insert(message)
    .values({
      conversationId: input.conversationId,
      userId: input.userId,
      role: input.role,
      content: input.content,
      toolCalls: input.toolCalls,
      usage: input.usage,
    })
    .returning();
  return row!;
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    toolCalls: (row.toolCalls as ToolCallRecord[]) ?? [],
    usage: (row.usage as MessageUsage | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function loadHistoryAsLlm(conversationId: string): Promise<LlmMessage[]> {
  const rows = await getDb()
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(asc(message.createdAt));
  const out: LlmMessage[] = [];
  for (const r of rows) {
    if (r.role === 'user') {
      // User rows are plain text; tool_results are appended in the same turn
      // as the assistant tool_use blocks they answer (not persisted as user
      // rows in our schema), so the regenerated history is text-only here.
      if (r.content) out.push({ role: 'user', content: [{ type: 'text', text: r.content }] });
    } else if (r.role === 'assistant') {
      const blocks: LlmContentBlock[] = [];
      if (r.content) blocks.push({ type: 'text', text: r.content });
      for (const t of (r.toolCalls as ToolCallRecord[]) ?? []) {
        blocks.push({ type: 'tool_use', id: t.id, name: t.name, input: t.input });
      }
      if (blocks.length > 0) out.push({ role: 'assistant', content: blocks });
      // Append the tool_results (as a user-role tool_result message) so Claude
      // sees the full history. (Live turns thread these in via runTurn's loop.)
      const trBlocks: LlmContentBlock[] = ((r.toolCalls as ToolCallRecord[]) ?? [])
        .filter((t) => t.result !== '')
        .map((t) => ({
          type: 'tool_result',
          toolUseId: t.id,
          content: t.result,
          ...(t.isError ? { isError: true } : {}),
        }));
      if (trBlocks.length > 0) out.push({ role: 'user', content: trBlocks });
    }
  }
  return out;
}

async function isDefaultTitle(conversationId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ title: conversation.title })
    .from(conversation)
    .where(eq(conversation.id, conversationId))
    .limit(1);
  return (rows[0]?.title ?? '') === 'New chat';
}

function deriveTitle(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 60);
}

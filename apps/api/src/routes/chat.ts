import { and, asc, desc, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type {
  ChatEvent,
  Conversation,
  ConversationWithMessages,
  Message,
  MessageRole,
  MessageUsage,
  ToolCallRecord,
} from '@ccc/shared';
import { requireSession } from '../auth/requireSession';
import { hasClaudeCredentials, type LlmStreamFn } from '../ai/llm';
import { runTurn } from '../ai/scout';
import { getDb } from '../db/client';
import {
  conversation,
  type ConversationRow,
  dog as dogTable,
  message,
  type MessageRow,
} from '../db/schema';
import { parsed } from '../lib/validate';

// --- mappers -------------------------------------------------------------

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    dogId: row.dogId ?? null,
    title: row.title,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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

// --- helpers -------------------------------------------------------------

function userId(request: FastifyRequest): string {
  return request.auth!.user.id;
}
function convoParam(request: FastifyRequest): string {
  return (request.params as { id: string }).id;
}

async function findConversation(uid: string, id: string): Promise<ConversationRow | null> {
  const rows = await getDb()
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, uid)))
    .limit(1);
  return rows[0] ?? null;
}

async function userOwnsDog(uid: string, dogId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: dogTable.id })
    .from(dogTable)
    .where(and(eq(dogTable.id, dogId), eq(dogTable.userId, uid)))
    .limit(1);
  return rows.length > 0;
}

const CreateConversationInput = z.object({
  dogId: z.string().uuid().nullish(),
  title: z.string().min(1).max(120).optional(),
});

const SendMessageInput = z.object({ text: z.string().min(1).max(20_000) });

// --- route registrar -----------------------------------------------------

export interface ChatDeps {
  /** Optional LLM override — tests inject a fake; production uses the real one. */
  llm?: LlmStreamFn;
}

export function chatRoutes(deps: ChatDeps = {}) {
  return async function (app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', requireSession);

    // Create a conversation (optionally anchored to a dog).
    app.post('/v1/conversations', async (request, reply) => {
      const uid = userId(request);
      const input = parsed(CreateConversationInput, request.body);
      if (input.dogId && !(await userOwnsDog(uid, input.dogId))) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dog not found' } });
      }
      const [row] = await getDb()
        .insert(conversation)
        .values({
          userId: uid,
          dogId: input.dogId ?? null,
          title: input.title ?? 'New chat',
        })
        .returning();
      return reply.status(201).send({ conversation: toConversation(row!) });
    });

    // List conversations (most-recent-first; archived included with ?includeArchived=true).
    app.get('/v1/conversations', async (request) => {
      const uid = userId(request);
      const includeArchived =
        (request.query as { includeArchived?: string }).includeArchived === 'true';
      const rows = await getDb()
        .select()
        .from(conversation)
        .where(
          includeArchived
            ? eq(conversation.userId, uid)
            : and(eq(conversation.userId, uid)) /* keep both for the future filter */,
        )
        .orderBy(desc(conversation.updatedAt));
      const list = includeArchived ? rows : rows.filter((r) => r.archivedAt === null);
      return { conversations: list.map(toConversation) };
    });

    // Fetch one conversation + all messages.
    app.get('/v1/conversations/:id', async (request, reply) => {
      const uid = userId(request);
      const row = await findConversation(uid, convoParam(request));
      if (!row)
        return reply
          .status(404)
          .send({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
      const msgs = await getDb()
        .select()
        .from(message)
        .where(eq(message.conversationId, row.id))
        .orderBy(asc(message.createdAt));
      const payload: ConversationWithMessages = {
        ...toConversation(row),
        messages: msgs.map(toMessage),
      };
      return { conversation: payload };
    });

    // Archive (soft-delete) a conversation.
    app.delete('/v1/conversations/:id', async (request, reply) => {
      const uid = userId(request);
      const id = convoParam(request);
      const row = await findConversation(uid, id);
      if (!row)
        return reply
          .status(404)
          .send({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
      await getDb()
        .update(conversation)
        .set({ archivedAt: new Date() })
        .where(and(eq(conversation.id, id), eq(conversation.userId, uid)));
      return reply.status(204).send();
    });

    // Send a user message → SSE stream of ChatEvents.
    app.post('/v1/conversations/:id/messages', async (request, reply) => {
      const uid = userId(request);
      const id = convoParam(request);
      const row = await findConversation(uid, id);
      if (!row)
        return reply
          .status(404)
          .send({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });

      const input = parsed(SendMessageInput, request.body);

      // If we don't have Claude credentials AND no test override, fail fast with a clear error
      // (the rest of the app still works; chat just isn't usable).
      if (!deps.llm && !hasClaudeCredentials()) {
        return reply.status(503).send({
          error: {
            code: 'NO_LLM_CREDENTIALS',
            message:
              'Claude credentials are not configured on the server. Set ANTHROPIC_AUTH_TOKEN (preferred — from `claude setup-token`) or ANTHROPIC_API_KEY.',
          },
        });
      }

      // Take over the response — manual SSE write.
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      reply.hijack();

      const send = (ev: ChatEvent) => {
        reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
      };

      try {
        for await (const ev of runTurn({
          userId: uid,
          conversationId: id,
          anchorDogId: row.dogId ?? null,
          userText: input.text,
          ...(deps.llm ? { llm: deps.llm } : {}),
        })) {
          send(ev);
        }
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) });
      } finally {
        reply.raw.end();
      }
    });
  };
}

// Helper (unused but exported for symmetry / future role-typed mappers).
export type { MessageRole };

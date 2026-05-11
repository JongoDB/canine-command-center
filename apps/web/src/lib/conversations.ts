import type { ChatEvent, Conversation, ConversationWithMessages } from '@ccc/shared';
import { api } from './api';
import { API_BASE_URL } from './config';

export const conversations = {
  list: () =>
    api.get<{ conversations: Conversation[] }>('/v1/conversations').then((r) => r.conversations),
  get: (id: string) =>
    api
      .get<{ conversation: ConversationWithMessages }>(`/v1/conversations/${id}`)
      .then((r) => r.conversation),
  create: (input: { dogId?: string | null; title?: string }) =>
    api
      .post<{ conversation: Conversation }>('/v1/conversations', input)
      .then((r) => r.conversation),
  archive: (id: string) =>
    api.request<unknown>(`/v1/conversations/${id}`, { method: 'DELETE' }).then(() => undefined),
};

/**
 * POST a user message to the chat SSE endpoint and yield `ChatEvent`s as they
 * arrive. Honours `AbortSignal` for stop-streaming. Designed so the chat screen
 * can `for await (const ev of streamScout(...))`.
 */
export async function* streamScout(
  conversationId: string,
  text: string,
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent, void, unknown> {
  const url = `${API_BASE_URL}/v1/conversations/${conversationId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    credentials: 'include',
    body: JSON.stringify({ text }),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    yield {
      type: 'error',
      message: `Scout request failed (${res.status}). ${body.slice(0, 300)}`,
    };
    return;
  }
  if (!res.body) {
    yield { type: 'error', message: 'Scout response had no body.' };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frames are separated by blank lines.
      let idx = buffer.indexOf('\n\n');
      while (idx !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const payload = frame
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('\n');
        if (payload) {
          try {
            yield JSON.parse(payload) as ChatEvent;
          } catch {
            // skip malformed frame
          }
        }
        idx = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
}

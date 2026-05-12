import type { ChatEvent, Conversation, ConversationWithMessages, Message } from '@ccc/shared';
import { api } from './api';
import { API_BASE_URL } from './config';
import { authClient } from './auth-client';

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
 * Send a user message and return the persisted messages (the user turn + the
 * assistant turn(s)). v1 mobile consumes the SSE stream non-incrementally — it
 * reads the whole response body, parses every `data:` frame, and returns the
 * `*_message_persisted` payloads. (Live token-by-token streaming on mobile is a
 * follow-up — XHR `onprogress` parsing the accumulating `responseText`.)
 */
export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<{ messages: Message[]; error: string | null }> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'text/event-stream',
  };
  const cookie = authClient.getCookie?.() ?? '';
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${API_BASE_URL}/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { messages: [], error: `Scout request failed (${res.status}). ${body.slice(0, 300)}` };
  }
  const raw = await res.text();
  const messages: Message[] = [];
  let error: string | null = null;
  for (const frame of raw.split('\n\n')) {
    const payload = frame
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('\n');
    if (!payload) continue;
    let ev: ChatEvent;
    try {
      ev = JSON.parse(payload) as ChatEvent;
    } catch {
      continue;
    }
    if (ev.type === 'user_message_persisted' || ev.type === 'assistant_message_persisted') {
      messages.push(ev.message);
    } else if (ev.type === 'error') {
      error = ev.message;
    }
  }
  return { messages, error };
}

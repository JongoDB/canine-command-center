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

function parseFrame(frame: string): ChatEvent | null {
  const payload = frame
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .join('\n');
  if (!payload) return null;
  try {
    return JSON.parse(payload) as ChatEvent;
  } catch {
    return null;
  }
}

/**
 * POST a user message to the chat SSE endpoint and deliver `ChatEvent`s to
 * `onEvent` as they arrive — live, token-by-token. RN's `fetch` has spotty
 * `ReadableStream` support, so this rides `XMLHttpRequest`'s `onprogress`,
 * parsing the SSE frames out of the accumulating `responseText`. Resolves when
 * the stream ends (a terminal `error` event is delivered to `onEvent`, not
 * thrown).
 */
export function streamScout(
  conversationId: string,
  text: string,
  onEvent: (ev: ChatEvent) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/v1/conversations/${conversationId}/messages`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');
    const cookie = authClient.getCookie?.() ?? '';
    if (cookie) xhr.setRequestHeader('Cookie', cookie);

    let consumed = 0; // chars of responseText already handed to `buffer`
    let buffer = '';

    function drain(final: boolean) {
      const full = xhr.responseText ?? '';
      if (full.length > consumed) {
        buffer += full.slice(consumed);
        consumed = full.length;
      }
      let idx = buffer.indexOf('\n\n');
      while (idx !== -1) {
        const ev = parseFrame(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
        if (ev) onEvent(ev);
        idx = buffer.indexOf('\n\n');
      }
      if (final && buffer.trim()) {
        const ev = parseFrame(buffer);
        buffer = '';
        if (ev) onEvent(ev);
      }
    }

    xhr.onprogress = () => {
      if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) drain(false);
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        onEvent({
          type: 'error',
          message: `Scout request failed (${xhr.status}). ${(xhr.responseText ?? '').slice(0, 300)}`,
        });
      } else {
        drain(true);
      }
      resolve();
    };
    xhr.onerror = () => {
      onEvent({ type: 'error', message: 'Network error talking to Scout.' });
      resolve();
    };
    xhr.send(JSON.stringify({ text }));
  });
}

/**
 * Convenience wrapper over {@link streamScout} for callers that only want the
 * final persisted turns (the user turn + the assistant turn(s)).
 */
export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<{ messages: Message[]; error: string | null }> {
  const messages: Message[] = [];
  let error: string | null = null;
  await streamScout(conversationId, text, (ev) => {
    if (ev.type === 'user_message_persisted' || ev.type === 'assistant_message_persisted') {
      messages.push(ev.message);
    } else if (ev.type === 'error') {
      error = ev.message;
    }
  });
  return { messages, error };
}

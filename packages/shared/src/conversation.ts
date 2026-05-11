// Scout chat — wire types between the API and clients. The API streams chat
// turns as Server-Sent Events; each event is one of `ChatEvent` below.

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ToolCallRecord {
  id: string;
  name: string;
  input: unknown;
  /** Stringified result of the tool, or an error message. */
  result: string;
  isError?: boolean;
}

export interface MessageUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolCalls: ToolCallRecord[];
  usage: MessageUsage | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  /** Optional anchor — Scout's context centres on this dog when set. */
  dogId: string | null;
  title: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// --- streaming events (one event per SSE `data:` frame) -------------------

export type ChatEvent =
  /** Server has received the user message and persisted it. */
  | { type: 'user_message_persisted'; message: Message }
  /** A new assistant turn is starting. */
  | { type: 'assistant_message_start'; messageId: string }
  /** Streaming text delta from the model. */
  | { type: 'text_delta'; text: string }
  /** Tool use begins. */
  | { type: 'tool_use_start'; id: string; name: string }
  /** Tool use input is complete (parsed JSON). */
  | { type: 'tool_use_input'; id: string; input: unknown }
  /** Tool result (stringified) — emitted before the next assistant turn. */
  | { type: 'tool_result'; id: string; result: string; isError: boolean }
  /** The current assistant turn is finished and persisted. */
  | { type: 'assistant_message_persisted'; message: Message }
  /** The full chat turn is done. */
  | { type: 'done' }
  /** Recoverable error (e.g. Claude is unreachable). The chat should show this calmly. */
  | { type: 'error'; message: string };

import Anthropic from '@anthropic-ai/sdk';
import type {
  ContentBlockParam,
  MessageParam,
  TextBlockParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import { env } from '../config/env';

/**
 * Anthropic streaming wrapper for "Scout".
 *
 * Auth: prefer the OAuth token from `claude setup-token`
 * (`ANTHROPIC_AUTH_TOKEN`, billed to the owner's Claude subscription); fall back
 * to an `ANTHROPIC_API_KEY`. The SDK sends `Authorization: Bearer <token>` for
 * authToken and `x-api-key: <key>` for apiKey — mutually exclusive on the wire.
 *
 * Caching: `cache_control: ephemeral` on the last system block (system prompt +
 * tool list cached together) AND top-level on the request, which auto-places a
 * second breakpoint on the latest user-turn block — the cached prefix grows
 * turn by turn. Pattern from plant-app's anthropicLlm.ts.
 *
 * One-turn semantics: `streamMessage` performs a single Claude turn. The
 * tool-use loop lives one layer up, in `scout.ts`.
 */

/** Default model — tune per-call or via ANTHROPIC_MODEL env. */
export const DEFAULT_MODEL = env.ANTHROPIC_MODEL ?? 'claude-opus-4-7';

/** Lifted into @ccc/shared at some point; for now, internal. */
export type LlmStopReason = 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';

export type LlmStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_use_start'; id: string; name: string }
  | { type: 'tool_use_input_delta'; id: string; partialJson: string }
  | { type: 'tool_use_end'; id: string }
  | { type: 'message_stop'; stopReason: LlmStopReason }
  | {
      type: 'usage';
      usage: {
        inputTokens?: number;
        outputTokens?: number;
        cacheCreationInputTokens?: number;
        cacheReadInputTokens?: number;
      };
    }
  | { type: 'error'; message: string };

/** Cross-platform message representation passed in. */
export interface LlmMessage {
  role: 'user' | 'assistant';
  content: LlmContentBlock[];
}

export type LlmContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; toolUseId: string; content: string; isError?: boolean };

export interface LlmTool {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}

export interface LlmStreamRequest {
  system: string;
  messages: LlmMessage[];
  tools?: LlmTool[];
  maxTokens?: number;
  model?: string;
}

/** The DI surface — `scout.ts` accepts an `LlmStreamFn` so tests can mock the LLM. */
export type LlmStreamFn = (req: LlmStreamRequest) => AsyncIterable<LlmStreamEvent>;

let _client: Anthropic | undefined;
function getClient(): Anthropic {
  if (_client) return _client;
  if (env.ANTHROPIC_AUTH_TOKEN) {
    _client = new Anthropic({ authToken: env.ANTHROPIC_AUTH_TOKEN });
  } else if (env.ANTHROPIC_API_KEY) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  } else {
    throw new Error(
      'No Claude credentials configured. Set ANTHROPIC_AUTH_TOKEN (preferred — from `claude setup-token`) or ANTHROPIC_API_KEY in apps/api/.env.',
    );
  }
  return _client;
}

/** True iff a Claude credential is configured. */
export function hasClaudeCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY);
}

export async function* streamMessage(req: LlmStreamRequest): AsyncIterable<LlmStreamEvent> {
  const client = getClient();
  const messages = req.messages.map(toAnthropicMessage);
  const tools = req.tools?.map(toAnthropicTool);

  const systemBlocks: TextBlockParam[] = [
    { type: 'text', text: req.system, cache_control: { type: 'ephemeral' } },
  ];

  let stream;
  try {
    stream = client.messages.stream({
      model: req.model ?? DEFAULT_MODEL,
      max_tokens: req.maxTokens ?? 4096,
      system: systemBlocks,
      messages,
      ...(tools ? { tools } : {}),
      // Top-level cache_control auto-places a second breakpoint on the latest
      // cacheable block (final user turn) — so the cached prefix grows turn by
      // turn without us tracking positions.
      cache_control: { type: 'ephemeral' },
    });
  } catch (err) {
    yield { type: 'error', message: errorMessage(err) };
    return;
  }

  // Track the active content block index → its tool-use id, so input deltas
  // can be tagged to the right tool call.
  const activeToolBlocks = new Map<number, { id: string }>();

  try {
    for await (const event of stream) {
      switch (event.type) {
        case 'content_block_start': {
          if (event.content_block.type === 'tool_use') {
            activeToolBlocks.set(event.index, { id: event.content_block.id });
            yield {
              type: 'tool_use_start',
              id: event.content_block.id,
              name: event.content_block.name,
            };
          }
          break;
        }
        case 'content_block_delta': {
          if (event.delta.type === 'text_delta') {
            yield { type: 'text_delta', text: event.delta.text };
          } else if (event.delta.type === 'input_json_delta') {
            const block = activeToolBlocks.get(event.index);
            if (block) {
              yield {
                type: 'tool_use_input_delta',
                id: block.id,
                partialJson: event.delta.partial_json,
              };
            }
          }
          break;
        }
        case 'content_block_stop': {
          const block = activeToolBlocks.get(event.index);
          if (block) {
            yield { type: 'tool_use_end', id: block.id };
            activeToolBlocks.delete(event.index);
          }
          break;
        }
        case 'message_delta': {
          if (event.delta.stop_reason && isStopReason(event.delta.stop_reason)) {
            yield { type: 'message_stop', stopReason: event.delta.stop_reason };
          }
          if (event.usage) {
            const u = event.usage;
            const out: {
              inputTokens?: number;
              outputTokens?: number;
              cacheCreationInputTokens?: number;
              cacheReadInputTokens?: number;
            } = { outputTokens: u.output_tokens };
            if (u.input_tokens != null) out.inputTokens = u.input_tokens;
            if (u.cache_creation_input_tokens != null)
              out.cacheCreationInputTokens = u.cache_creation_input_tokens;
            if (u.cache_read_input_tokens != null)
              out.cacheReadInputTokens = u.cache_read_input_tokens;
            yield { type: 'usage', usage: out };
          }
          break;
        }
      }
    }
  } catch (err) {
    yield { type: 'error', message: errorMessage(err) };
  }
}

// --- translators ---------------------------------------------------------

function toAnthropicMessage(msg: LlmMessage): MessageParam {
  return { role: msg.role, content: msg.content.map(toAnthropicContent) };
}

function toAnthropicContent(block: LlmContentBlock): ContentBlockParam {
  switch (block.type) {
    case 'text':
      return { type: 'text', text: block.text } satisfies TextBlockParam;
    case 'tool_use':
      return {
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: block.input as ToolUseBlockParam['input'],
      } satisfies ToolUseBlockParam;
    case 'tool_result':
      return {
        type: 'tool_result',
        tool_use_id: block.toolUseId,
        content: block.content,
        ...(block.isError ? { is_error: true } : {}),
      } satisfies ToolResultBlockParam;
  }
}

function toAnthropicTool(tool: LlmTool): Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Tool['input_schema'],
  };
}

function isStopReason(reason: string): reason is LlmStopReason {
  return (
    reason === 'end_turn' ||
    reason === 'tool_use' ||
    reason === 'max_tokens' ||
    reason === 'stop_sequence'
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIError) return `${err.status ?? ''} ${err.message}`.trim();
  if (err instanceof Error) return err.message;
  return String(err);
}

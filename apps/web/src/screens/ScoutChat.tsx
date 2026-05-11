import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ApiError,
  BRANDING,
  type ChatEvent,
  type ConversationWithMessages,
  type Dog,
  type Message,
} from '@ccc/shared';
import { conversations, streamScout } from '../lib/conversations';
import { dogs } from '../lib/dogs';

const SUGGESTED_PROMPTS_DEFAULT = [
  'What should I work on this week?',
  'How do I build a bomb-proof recall?',
  'My pup is biting everything — help.',
  'Help me design a calm settle routine.',
];
const SUGGESTED_PROMPTS_ANCHORED = (dogName: string) => [
  `What should I work on with ${dogName} this week?`,
  `What's a great recall game for ${dogName}?`,
  `Adjust my plan — ${dogName} feels stuck on loose-leash.`,
  `${dogName} just turned 6 months — what's the adolescence playbook?`,
];

function MessageBubble({ m, assistantName }: { m: Message; assistantName: string }) {
  const isUser = m.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        className="eyebrow"
        style={{
          color: isUser ? 'var(--text-muted)' : 'var(--tan)',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {isUser ? 'You' : assistantName}
      </div>
      <div
        style={{
          background: isUser ? 'var(--steel)' : 'var(--steel-mid)',
          color: 'var(--cream)',
          padding: '12px 14px',
          maxWidth: 560,
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          whiteSpace: 'pre-wrap',
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {m.content || (m.toolCalls.length > 0 ? '(using tools…)' : '…')}
      </div>
      {m.toolCalls.length > 0 && (
        <div
          className="muted"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 1,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          Used: {m.toolCalls.map((t) => t.name).join(' · ')}
        </div>
      )}
    </div>
  );
}

export function ScoutChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [convo, setConvo] = useState<ConversationWithMessages | null>(null);
  const [anchoredDog, setAnchoredDog] = useState<Dog | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initial load.
  useEffect(() => {
    if (!id) return;
    let live = true;
    conversations
      .get(id)
      .then(async (c) => {
        if (!live) return;
        setConvo(c);
        if (c.dogId) {
          try {
            const d = await dogs.get(c.dogId);
            if (live) setAnchoredDog(d);
          } catch {
            // anchored dog might have been archived; ignore
          }
        }
      })
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) navigate('/scout', { replace: true });
        else if (e instanceof ApiError && e.status === 401) navigate('/sign-in', { replace: true });
        else setError(e instanceof Error ? e.message : 'Could not load this chat.');
      });
    return () => {
      live = false;
    };
  }, [id, navigate]);

  // Auto-scroll to bottom on new messages / deltas.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [convo?.messages.length, convo?.messages.at(-1)?.content]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!id || !convo || streaming || !draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    setStreaming(true);
    setError(null);

    // Optimistic: append a placeholder user message so it shows up immediately;
    // the server's `user_message_persisted` event will replace it with the real one.
    const optimisticUserId = `pending-${Date.now()}`;
    const optimisticUser: Message = {
      id: optimisticUserId,
      conversationId: id,
      role: 'user',
      content: text,
      toolCalls: [],
      usage: null,
      createdAt: new Date().toISOString(),
    };
    setConvo({ ...convo, messages: [...convo.messages, optimisticUser] });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // We track the currently-streaming assistant message id and accumulate text on it.
      let streamingAssistantId: string | null = null;
      for await (const ev of streamScout(id, text, controller.signal)) {
        applyEvent(ev);
      }

      function applyEvent(ev: ChatEvent) {
        setConvo((prev) => {
          if (!prev) return prev;
          let messages = prev.messages;
          if (ev.type === 'user_message_persisted') {
            messages = messages.map((m) => (m.id === optimisticUserId ? ev.message : m));
          } else if (ev.type === 'assistant_message_start') {
            // Add a placeholder assistant message we'll mutate as deltas arrive.
            streamingAssistantId = `streaming-${Date.now()}`;
            messages = [
              ...messages,
              {
                id: streamingAssistantId,
                conversationId: id!,
                role: 'assistant',
                content: '',
                toolCalls: [],
                usage: null,
                createdAt: new Date().toISOString(),
              },
            ];
          } else if (ev.type === 'text_delta' && streamingAssistantId) {
            messages = messages.map((m) =>
              m.id === streamingAssistantId ? { ...m, content: m.content + ev.text } : m,
            );
          } else if (ev.type === 'tool_use_start' && streamingAssistantId) {
            messages = messages.map((m) =>
              m.id === streamingAssistantId
                ? {
                    ...m,
                    toolCalls: [
                      ...m.toolCalls,
                      { id: ev.id, name: ev.name, input: {}, result: '' },
                    ],
                  }
                : m,
            );
          } else if (ev.type === 'tool_use_input' && streamingAssistantId) {
            messages = messages.map((m) =>
              m.id === streamingAssistantId
                ? {
                    ...m,
                    toolCalls: m.toolCalls.map((t) =>
                      t.id === ev.id ? { ...t, input: ev.input } : t,
                    ),
                  }
                : m,
            );
          } else if (ev.type === 'tool_result' && streamingAssistantId) {
            messages = messages.map((m) =>
              m.id === streamingAssistantId
                ? {
                    ...m,
                    toolCalls: m.toolCalls.map((t) =>
                      t.id === ev.id ? { ...t, result: ev.result, isError: ev.isError } : t,
                    ),
                  }
                : m,
            );
          } else if (ev.type === 'assistant_message_persisted' && streamingAssistantId) {
            messages = messages.map((m) => (m.id === streamingAssistantId ? ev.message : m));
            // The model may produce another turn after a tool result; on the next
            // assistant_message_start we'll add another placeholder.
            streamingAssistantId = null;
          } else if (ev.type === 'error') {
            setError(ev.message);
          }
          return { ...prev, messages };
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stream failed.');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  const messages = convo?.messages ?? [];
  const suggested = anchoredDog
    ? SUGGESTED_PROMPTS_ANCHORED(anchoredDog.name)
    : SUGGESTED_PROMPTS_DEFAULT;

  return (
    <div className="screen">
      <header className="appbar">
        <Link to="/scout" className="brand" style={{ textDecoration: 'none' }}>
          {BRANDING.appNameShort}
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {anchoredDog && (
            <span
              className="pill ok"
              style={{ color: 'var(--tan-light)', borderColor: 'var(--tan)' }}
            >
              Anchored: {anchoredDog.name}
            </span>
          )}
          <Link to="/scout" style={{ fontSize: 13 }}>
            ← All chats
          </Link>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
          padding: '20px 20px 0',
          minHeight: 0,
        }}
      >
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingBottom: 16,
          }}
        >
          {!convo ? (
            <span className="muted">Loading…</span>
          ) : messages.length === 0 ? (
            <div className="stack">
              <div className="eyebrow">Suggested</div>
              {suggested.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="ghost"
                  style={{ textAlign: 'left' }}
                  onClick={() => setDraft(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} m={m} assistantName={BRANDING.assistantName} />
            ))
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <form
          onSubmit={onSend}
          style={{
            borderTop: '1px solid var(--hairline)',
            paddingTop: 12,
            paddingBottom: 16,
            display: 'flex',
            gap: 12,
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              anchoredDog
                ? `Ask ${BRANDING.assistantName} about ${anchoredDog.name}…`
                : `Ask ${BRANDING.assistantName} anything…`
            }
            disabled={streaming}
            style={{ flex: 1 }}
          />
          {streaming ? (
            <button type="button" onClick={stop} style={{ width: 'auto', padding: '0 18px' }}>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={draft.trim() === ''}
              style={{ width: 'auto', padding: '0 18px' }}
            >
              Send
            </button>
          )}
        </form>
      </main>
    </div>
  );
}

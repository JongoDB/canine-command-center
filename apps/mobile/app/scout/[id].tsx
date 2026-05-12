import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ApiError,
  BRANDING,
  type ConversationWithMessages,
  type Dog,
  type Message,
} from '@ccc/shared';
import { conversations, streamScout } from '../../src/lib/conversations';
import { dogs as dogsApi } from '../../src/lib/dogs';
import {
  ErrorText,
  GhostButton,
  Link,
  Muted,
  PrimaryButton,
  Screen,
} from '../../src/components/ui';
import { theme } from '../../src/theme';

const SUGGESTED_DEFAULT = [
  'What should I work on this week?',
  'How do I build a bomb-proof recall?',
  'My pup is biting everything — help.',
];
const SUGGESTED_ANCHORED = (n: string) => [
  `What should I work on with ${n} this week?`,
  `What's a great recall game for ${n}?`,
  `${n} just turned 6 months — what's coming up?`,
];

function Bubble({ m, assistantName }: { m: Message; assistantName: string }) {
  const isUser = m.role === 'user';
  return (
    <View style={{ marginBottom: theme.space.md, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <Text style={[s.who, { color: isUser ? theme.colors.textMuted : theme.colors.tan }]}>
        {isUser ? 'You' : assistantName}
      </Text>
      <View
        style={[s.bubble, { backgroundColor: isUser ? theme.colors.steel : theme.colors.steelMid }]}
      >
        <Text style={s.bubbleText}>
          {m.content || (m.toolCalls.length > 0 ? '(using tools…)' : '…')}
        </Text>
      </View>
      {m.toolCalls.length > 0 ? (
        <Text style={s.toolNote}>Used: {m.toolCalls.map((t) => t.name).join(' · ')}</Text>
      ) : null}
    </View>
  );
}

export default function ScoutChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [convo, setConvo] = useState<ConversationWithMessages | null>(null);
  const [anchoredDog, setAnchoredDog] = useState<Dog | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  // Live assistant turn while streaming: `null` when idle, otherwise the text
  // so far (may be '' between turns / before the first delta).
  const [streamText, setStreamText] = useState<string | null>(null);
  const [streamTools, setStreamTools] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const bumpScroll = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30);

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
            const d = await dogsApi.get(c.dogId);
            if (live) setAnchoredDog(d);
          } catch {
            /* dog may be archived */
          }
        }
      })
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) router.replace('/scout');
        else if (e instanceof ApiError && e.status === 401) router.replace('/sign-in');
        else setError(e instanceof Error ? e.message : 'Could not load this chat.');
      });
    return () => {
      live = false;
    };
  }, [id, router]);

  async function onSend() {
    if (!id || !convo || busy || draft.trim() === '') return;
    const text = draft.trim();
    setDraft('');
    setBusy(true);
    setError(null);
    setStreamText(''); // show the live assistant bubble straight away
    setStreamTools([]);
    // Optimistic user bubble.
    const optimisticId = `pending-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      conversationId: id,
      role: 'user',
      content: text,
      toolCalls: [],
      usage: null,
      createdAt: new Date().toISOString(),
    };
    setConvo({ ...convo, messages: [...convo.messages, optimistic] });
    bumpScroll();

    let gotAnyMessage = false;
    let hadError = false;
    await streamScout(id, text, (ev) => {
      switch (ev.type) {
        case 'user_message_persisted':
          gotAnyMessage = true;
          setConvo((prev) =>
            prev
              ? {
                  ...prev,
                  messages: prev.messages.map((m) => (m.id === optimisticId ? ev.message : m)),
                }
              : prev,
          );
          break;
        case 'assistant_message_start':
          setStreamText('');
          setStreamTools([]);
          break;
        case 'text_delta':
          setStreamText((t) => (t ?? '') + ev.text);
          bumpScroll();
          break;
        case 'tool_use_start':
          setStreamTools((ts) => [...ts, ev.name]);
          break;
        case 'assistant_message_persisted':
          gotAnyMessage = true;
          setConvo((prev) => (prev ? { ...prev, messages: [...prev.messages, ev.message] } : prev));
          setStreamText(''); // ready for a possible next turn
          setStreamTools([]);
          break;
        case 'error':
          hadError = true;
          setError(ev.message);
          break;
        case 'done':
          break;
        default:
          break;
      }
    });

    setBusy(false);
    setStreamText(null);
    setStreamTools([]);
    if (!gotAnyMessage && !hadError) {
      // No message events at all — fall back to a re-fetch.
      try {
        setConvo(await conversations.get(id));
      } catch {
        /* keep what we have */
      }
    }
    bumpScroll();
  }

  const messages = convo?.messages ?? [];
  const suggested = anchoredDog ? SUGGESTED_ANCHORED(anchoredDog.name) : SUGGESTED_DEFAULT;

  return (
    <Screen>
      <View style={s.appbar}>
        <Link label="← Chats" onPress={() => router.replace('/scout')} />
        {anchoredDog ? <Text style={s.anchor}>Anchored: {anchoredDog.name}</Text> : <View />}
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: theme.space.md }}
      >
        {!convo ? (
          <Muted>Loading…</Muted>
        ) : messages.length === 0 ? (
          <View>
            <Text style={s.eyebrow}>Suggested</Text>
            {suggested.map((sgst) => (
              <View key={sgst} style={{ marginBottom: theme.space.sm }}>
                <GhostButton label={sgst} onPress={() => setDraft(sgst)} />
              </View>
            ))}
          </View>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} assistantName={BRANDING.assistantName} />)
        )}
        {streamText !== null ? (
          <View style={{ marginBottom: theme.space.md, alignItems: 'flex-start' }}>
            <Text style={[s.who, { color: theme.colors.tan }]}>{BRANDING.assistantName}</Text>
            <View style={[s.bubble, { backgroundColor: theme.colors.steelMid }]}>
              <Text style={s.bubbleText}>
                {streamText ||
                  (streamTools.length > 0 ? `Using ${streamTools[streamTools.length - 1]}…` : '…')}
              </Text>
            </View>
            {streamTools.length > 0 ? (
              <Text style={s.toolNote}>Used: {streamTools.join(' · ')}</Text>
            ) : null}
          </View>
        ) : busy ? (
          <Muted>{BRANDING.assistantName} is thinking…</Muted>
        ) : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
      </ScrollView>

      <View style={s.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={
            anchoredDog
              ? `Ask ${BRANDING.assistantName} about ${anchoredDog.name}…`
              : `Ask ${BRANDING.assistantName} anything…`
          }
          placeholderTextColor={theme.colors.textMuted}
          editable={!busy}
          multiline
          style={s.input}
        />
        <View style={{ width: 80 }}>
          <PrimaryButton
            label="Send"
            onPress={onSend}
            loading={busy}
            disabled={draft.trim() === ''}
          />
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.space.md,
    borderBottomColor: theme.colors.hairline,
    borderBottomWidth: 1,
  },
  anchor: {
    color: theme.colors.tanLight,
    fontSize: theme.fontSize.micro,
    fontFamily: undefined,
    letterSpacing: theme.tracking.normal,
    borderColor: theme.colors.tan,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: theme.space.sm,
  },
  eyebrow: {
    color: theme.colors.tan,
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.wider,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.space.sm,
  },
  who: {
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.wide,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  bubble: { padding: theme.space.md, maxWidth: '88%' },
  bubbleText: { color: theme.colors.cream, fontSize: theme.fontSize.body, lineHeight: 21 },
  toolNote: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.micro,
    marginTop: 4,
    letterSpacing: theme.tracking.normal,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space.sm,
    borderTopColor: theme.colors.hairline,
    borderTopWidth: 1,
    paddingTop: theme.space.md,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.steelMid,
    borderWidth: 1,
    color: theme.colors.cream,
    fontSize: theme.fontSize.body,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.md,
    maxHeight: 120,
  },
});

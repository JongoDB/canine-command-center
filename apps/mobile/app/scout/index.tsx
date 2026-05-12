import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError, BRANDING, type Conversation } from '@ccc/shared';
import { conversations } from '../../src/lib/conversations';
import {
  Body,
  ErrorText,
  GhostButton,
  Link,
  Muted,
  PrimaryButton,
  Screen,
} from '../../src/components/ui';
import { theme } from '../../src/theme';

export default function ScoutList() {
  const router = useRouter();
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      setError(null);
      conversations
        .list()
        .then((c) => live && setConvos(c))
        .catch((e: unknown) => {
          if (!live) return;
          if (e instanceof ApiError && e.status === 401) router.replace('/sign-in');
          else setError(e instanceof Error ? e.message : 'Could not load conversations.');
        });
      return () => {
        live = false;
      };
    }, [router]),
  );

  async function onNew() {
    setBusy(true);
    setError(null);
    try {
      const c = await conversations.create({});
      router.push({ pathname: '/scout/[id]', params: { id: c.id } });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Could not start a chat.');
    }
  }

  return (
    <Screen>
      <View style={s.appbar}>
        <Link label="← Home" onPress={() => router.replace('/')} />
        <GhostButton label="New chat" onPress={onNew} />
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: theme.space.lg, paddingBottom: 40 }}>
        <Text style={s.eyebrow}>{BRANDING.assistantName}</Text>
        <Text style={s.title}>Chats</Text>
        <Muted>
          Talk to {BRANDING.assistantName}, your in-app dog expert. Anchor a chat to a dog from its
          profile, or start a free-form one.
        </Muted>
        <View style={{ height: theme.space.md }} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        {busy ? <Muted>Starting…</Muted> : null}
        {convos === null ? (
          <Muted>Loading…</Muted>
        ) : convos.length === 0 ? (
          <View style={s.notice}>
            <Body>
              No chats yet. Tap “New chat”, or open a dog and choose “Talk to{' '}
              {BRANDING.assistantName}”.
            </Body>
          </View>
        ) : (
          convos.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/scout/[id]', params: { id: c.id } })}
              style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.cardTitle}>{c.title || 'New chat'}</Text>
              <Muted>
                Updated {new Date(c.updatedAt).toLocaleString()}
                {c.dogId ? ' · anchored to a dog' : ''}
              </Muted>
            </Pressable>
          ))
        )}
        <View style={{ height: theme.space.lg }} />
        <PrimaryButton label="+ New chat" onPress={onNew} loading={busy} />
      </ScrollView>
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
  eyebrow: {
    color: theme.colors.tan,
    fontFamily: theme.font.mono,
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.wider,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.cream,
    fontFamily: theme.font.display,
    fontSize: 44,
    letterSpacing: theme.tracking.normal,
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 6,
  },
  notice: {
    borderLeftColor: theme.colors.tan,
    borderLeftWidth: 3,
    backgroundColor: theme.colors.steel,
    padding: theme.space.md,
  },
  card: {
    backgroundColor: theme.colors.steel,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    padding: theme.space.lg,
    marginBottom: theme.space.sm,
  },
  cardTitle: {
    color: theme.colors.cream,
    fontFamily: theme.font.display,
    fontSize: 24,
    letterSpacing: theme.tracking.normal,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
});

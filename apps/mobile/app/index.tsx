import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BRANDING } from '@ccc/shared';
import { api } from '../src/lib/api';
import { signOut, useSession } from '../src/lib/auth-client';
import { Body, GhostButton, Muted, Screen } from '../src/components/ui';
import { theme } from '../src/theme';

type Health = 'checking' | 'ok' | 'down';

export default function Home() {
  const router = useRouter();
  const { data } = useSession();
  const [health, setHealth] = useState<Health>('checking');

  useEffect(() => {
    let live = true;
    api
      .health()
      .then((h) => live && setHealth(h.db === 'ok' ? 'ok' : 'down'))
      .catch(() => live && setHealth('down'));
    return () => {
      live = false;
    };
  }, []);

  async function onSignOut() {
    await signOut();
    router.replace('/sign-in');
  }

  return (
    <Screen>
      <View style={s.appbar}>
        <Text style={s.brand}>{BRANDING.appNameShort}</Text>
        <View style={s.right}>
          <View style={[s.pill, health === 'ok' && s.pillOk, health === 'down' && s.pillDown]}>
            <Text
              style={[
                s.pillText,
                health === 'ok' && s.pillOkText,
                health === 'down' && s.pillDownText,
              ]}
            >
              API {health}
            </Text>
          </View>
          <GhostButton label="Sign out" onPress={onSignOut} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>Home</Text>
        <Text style={s.title}>You’re in.</Text>
        {data?.user?.email ? <Muted>{data.user.email}</Muted> : null}
        <View style={{ height: theme.space.lg }} />
        <Body>
          This is the skeleton — auth is wired end to end. Next up: dog intake, the breed-aware
          training program, the health timeline, and {BRANDING.assistantName} (your in-app expert).
        </Body>
        <View style={{ height: theme.space.md }} />
        <View style={s.notice}>
          <Muted>
            The real screens (Today · Program · {BRANDING.assistantName} · Health · More) land in
            Phase 1 — see docs/ROADMAP.md and docs/BUILDLOG.md.
          </Muted>
        </View>
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
  brand: {
    color: theme.colors.cream,
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: theme.tracking.wide,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  pill: {
    borderColor: theme.colors.steelMid,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: theme.space.sm,
  },
  pillOk: { borderColor: theme.colors.tan },
  pillDown: { borderColor: theme.colors.accent },
  pillText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.micro,
    letterSpacing: theme.tracking.normal,
  },
  pillOkText: { color: theme.colors.tanLight },
  pillDownText: { color: theme.colors.accentLight },
  content: { paddingTop: theme.space.xl },
  eyebrow: {
    color: theme.colors.tan,
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.wider,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
  },
  title: {
    color: theme.colors.cream,
    fontSize: 44,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: theme.tracking.wide,
    marginTop: theme.space.xs,
  },
  notice: {
    borderLeftColor: theme.colors.tan,
    borderLeftWidth: 3,
    backgroundColor: theme.colors.steel,
    padding: theme.space.md,
  },
});

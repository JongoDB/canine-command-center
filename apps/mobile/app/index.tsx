import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ApiError, BRANDING, breedLabel, type Dog } from '@ccc/shared';
import { api } from '../src/lib/api';
import { dogs as dogsApi } from '../src/lib/dogs';
import { signOut, useSession } from '../src/lib/auth-client';
import { Body, ErrorText, GhostButton, Muted, PrimaryButton, Screen } from '../src/components/ui';
import { theme } from '../src/theme';

type Health = 'checking' | 'ok' | 'down';

export default function Home() {
  const router = useRouter();
  const { data } = useSession();
  const [health, setHealth] = useState<Health>('checking');
  const [dogs, setDogs] = useState<Dog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Refresh the dog list every time the home regains focus (after creating/editing).
  useFocusEffect(
    useCallback(() => {
      let live = true;
      setError(null);
      dogsApi
        .list()
        .then((d) => live && setDogs(d))
        .catch((e: unknown) => {
          if (!live) return;
          setError(e instanceof Error ? e.message : 'Could not load your dogs.');
          if (e instanceof ApiError && e.status === 401) router.replace('/sign-in');
        });
      return () => {
        live = false;
      };
    }, [router]),
  );

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

      <ScrollView contentContainerStyle={{ paddingTop: theme.space.lg, paddingBottom: 40 }}>
        <View style={s.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>Your dogs</Text>
            <Text style={s.title}>Today</Text>
            {data?.user?.email ? <Muted>{data.user.email}</Muted> : null}
          </View>
          <View style={{ minWidth: 130 }}>
            <PrimaryButton label="+ New dog" onPress={() => router.push('/onboard')} />
          </View>
        </View>

        {error ? <ErrorText>{error}</ErrorText> : null}

        {dogs === null ? (
          <Muted>Loading your dogs…</Muted>
        ) : dogs.length === 0 ? (
          <View style={s.notice}>
            <Body>
              No dogs yet. Tap{' '}
              <Text style={{ color: theme.colors.tan }} onPress={() => router.push('/onboard')}>
                + New dog
              </Text>{' '}
              to create one — we ship a Belgian Malinois × Dutch Shepherd default you can tap
              through, or start fresh.
            </Body>
          </View>
        ) : (
          <View style={{ marginTop: theme.space.md }}>
            {dogs.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => router.push({ pathname: '/dogs/[id]', params: { id: d.id } })}
                style={({ pressed }) => [s.dogCard, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.dogName}>{d.name}</Text>
                  <Muted>
                    {breedLabel(d.breed)}
                    {d.sex !== 'unknown' ? ` · ${d.sex}` : ''}
                    {d.ageMonths !== null
                      ? ` · ${Math.floor(d.ageMonths / 12)}y ${d.ageMonths % 12}mo`
                      : ''}
                  </Muted>
                </View>
                <Text style={{ color: theme.colors.tan, fontSize: theme.fontSize.bodySm }}>
                  View →
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={[s.notice, { marginTop: theme.space.lg }]}>
          <Muted>
            The real Today / Program / {BRANDING.assistantName} / Health screens land in Phase 1 —
            see docs/ROADMAP.md.
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.space.md,
    marginBottom: theme.space.md,
  },
  eyebrow: {
    color: theme.colors.tan,
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.wider,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
  },
  title: {
    color: theme.colors.cream,
    fontSize: 40,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: theme.tracking.wide,
    marginTop: 2,
  },
  notice: {
    borderLeftColor: theme.colors.tan,
    borderLeftWidth: 3,
    backgroundColor: theme.colors.steel,
    padding: theme.space.md,
  },
  dogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.steel,
    borderColor: theme.colors.hairline,
    borderWidth: 1,
    padding: theme.space.lg,
    marginBottom: theme.space.sm,
  },
  dogName: {
    color: theme.colors.cream,
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: theme.tracking.wide,
    marginBottom: 4,
  },
});

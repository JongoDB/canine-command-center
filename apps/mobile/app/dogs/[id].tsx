import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError, BRANDING, breedLabel, type Dog, type IntakeResponse } from '@ccc/shared';
import { conversations } from '../../src/lib/conversations';
import { dogs as dogsApi } from '../../src/lib/dogs';
import {
  Body,
  Card,
  ErrorText,
  Eyebrow,
  GhostButton,
  Link,
  Muted,
  PrimaryButton,
  Screen,
  Title,
} from '../../src/components/ui';
import { theme } from '../../src/theme';

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{pretty(value)}</Text>
    </View>
  );
}

export default function DogProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [intake, setIntake] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setError(null);
    Promise.all([
      dogsApi.get(id),
      dogsApi
        .getIntake(id)
        .catch((e: unknown) =>
          e instanceof ApiError && e.status === 404 ? null : Promise.reject(e),
        ),
    ])
      .then(([d, i]) => {
        if (!live) return;
        setDog(d);
        setIntake(i);
      })
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) router.replace('/');
        else setError(e instanceof Error ? e.message : 'Could not load this dog.');
      });
    return () => {
      live = false;
    };
  }, [id, router]);

  if (!dog) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {error ? <ErrorText>{error}</ErrorText> : <Muted>Loading…</Muted>}
        </View>
      </Screen>
    );
  }

  function onArchive() {
    if (!dog) return;
    Alert.alert(
      `Archive ${dog.name}?`,
      'You can re-create them later but their record is removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setArchiving(true);
            try {
              await dogsApi.archive(dog!.id);
              router.replace('/');
            } catch (e) {
              setArchiving(false);
              setError(e instanceof Error ? e.message : 'Could not archive this dog.');
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ marginBottom: theme.space.md }}>
          <Link label="← Home" onPress={() => router.replace('/')} />
        </View>
        <Eyebrow>Profile</Eyebrow>
        <View style={{ height: theme.space.sm }} />
        <Title>{dog.name}</Title>
        <View style={{ height: 4 }} />
        <Muted>
          {breedLabel(dog.breed)}
          {dog.sex !== 'unknown' ? ` · ${dog.sex}` : ''}
          {dog.ageMonths !== null
            ? ` · ${Math.floor(dog.ageMonths / 12)}y ${dog.ageMonths % 12}mo`
            : ''}
        </Muted>

        <View style={{ height: theme.space.lg }} />
        <Card>
          <Row label="Sex" value={dog.sex} />
          <Row label="Neuter" value={dog.neuterStatus} />
          <Row
            label="Birth date"
            value={
              dog.birthDate ? `${dog.birthDate}${dog.birthDateIsEstimate ? ' (est.)' : ''}` : null
            }
          />
          <Row label="Weight (kg)" value={dog.weightKg} />
          <Row label="Color" value={dog.color} />
          <Row label="Microchip" value={dog.microchip} />
          <Row label="Source" value={dog.source} />
          <Row label="Got them on" value={dog.acquiredOn} />
          <Row label="Age (wks) when got" value={dog.acquiredAtAgeWeeks} />
          <Row label="Notes" value={dog.notes} />
        </Card>

        <View style={{ height: theme.space.md }} />
        <Card>
          <Eyebrow>Intake</Eyebrow>
          <View style={{ height: 6 }} />
          {intake ? (
            <>
              <Muted>
                Submitted v{intake.version} on {new Date(intake.createdAt).toLocaleDateString()}.
              </Muted>
              <View style={{ height: 6 }} />
              <Row label="Living" value={intake.answers.living} />
              <Row label="Goals" value={intake.answers.goals} />
              <Row label="History" value={intake.answers.history} />
              <Row label="Current" value={intake.answers.current} />
            </>
          ) : (
            <Body>No intake submitted yet (the rich intake lives on the web app for now).</Body>
          )}
        </Card>

        {error ? (
          <View style={{ marginTop: theme.space.md }}>
            <ErrorText>{error}</ErrorText>
          </View>
        ) : null}

        <View style={{ marginTop: theme.space.lg }}>
          <PrimaryButton
            label={`Talk to ${BRANDING.assistantName} about ${dog.name}`}
            onPress={async () => {
              try {
                const c = await conversations.create({ dogId: dog.id });
                router.push({ pathname: '/scout/[id]', params: { id: c.id } });
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not start a chat.');
              }
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: theme.space.md, marginTop: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Edit"
              onPress={() => router.push({ pathname: '/dogs/[id]/edit', params: { id: dog.id } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={archiving ? 'Archiving…' : 'Archive'}
              onPress={onArchive}
              loading={archiving}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomColor: theme.colors.hairline,
    borderBottomWidth: 1,
    gap: theme.space.md,
  },
  rowLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.normal,
    textTransform: 'uppercase',
    minWidth: 130,
  },
  rowValue: {
    color: theme.colors.cream,
    fontSize: theme.fontSize.bodySm,
    flex: 1,
    flexWrap: 'wrap',
  },
});

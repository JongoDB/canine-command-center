import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError, type Dog, type DogProfileInput } from '@ccc/shared';
import { dogs } from '../../../src/lib/dogs';
import { IntakeSectionA } from '../../../src/components/intake-section-a';
import { PhotoPickerRow } from '../../../src/components/photo-picker';
import {
  Card,
  ErrorText,
  Eyebrow,
  GhostButton,
  Link,
  Muted,
  PrimaryButton,
  Screen,
  Title,
} from '../../../src/components/ui';
import { theme } from '../../../src/theme';

function dogToProfile(d: Dog): DogProfileInput {
  return {
    name: d.name,
    breed: d.breed,
    sex: d.sex,
    neuterStatus: d.neuterStatus,
    neuteredOn: d.neuteredOn,
    birthDate: d.birthDate,
    birthDateIsEstimate: d.birthDateIsEstimate,
    weightKg: d.weightKg,
    color: d.color,
    microchip: d.microchip,
    source: d.source,
    acquiredOn: d.acquiredOn,
    acquiredAtAgeWeeks: d.acquiredAtAgeWeeks,
    notes: d.notes,
    photoMediaId: d.photoMediaId,
  };
}

export default function EditDog() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<DogProfileInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    dogs
      .get(id)
      .then((d) => live && setProfile(dogToProfile(d)))
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) router.replace('/');
        else setError(e instanceof Error ? e.message : 'Could not load this dog.');
      });
    return () => {
      live = false;
    };
  }, [id, router]);

  if (!profile || !id) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {error ? <ErrorText>{error}</ErrorText> : <Muted>Loading…</Muted>}
        </View>
      </Screen>
    );
  }

  async function onSave() {
    if (!profile || !id) return;
    setBusy(true);
    setError(null);
    try {
      await dogs.update(id, profile);
      router.replace({ pathname: '/dogs/[id]', params: { id } });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Could not save changes.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ marginBottom: theme.space.md }}>
          <Link
            label="← Back"
            onPress={() => router.replace({ pathname: '/dogs/[id]', params: { id } })}
          />
        </View>
        <Eyebrow>Edit · Identity</Eyebrow>
        <View style={{ height: theme.space.sm }} />
        <Title>{profile.name || 'Edit dog'}</Title>
        <View style={{ height: theme.space.lg }} />
        <Card>
          <PhotoPickerRow
            mediaId={profile.photoMediaId}
            onChange={(mid) => setProfile((p) => (p ? { ...p, photoMediaId: mid } : p))}
          />
          <View style={{ height: theme.space.md }} />
          <IntakeSectionA profile={profile} setProfile={setProfile} />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <View style={{ flexDirection: 'row', gap: theme.space.md, marginTop: theme.space.md }}>
            <View style={{ flex: 1 }}>
              <GhostButton
                label="Cancel"
                onPress={() => router.replace({ pathname: '/dogs/[id]', params: { id } })}
              />
            </View>
            <View style={{ flex: 2 }}>
              <PrimaryButton
                label={busy ? 'Saving…' : 'Save changes'}
                onPress={onSave}
                loading={busy}
                disabled={profile.name.trim() === ''}
              />
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

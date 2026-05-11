import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ApiError,
  type DogProfileInput,
  EMPTY_DEFAULT_PROFILE,
  MAL_DUTCH_DEFAULT_PROFILE,
} from '@ccc/shared';
import { dogs } from '../src/lib/dogs';
import { IntakeSectionA } from '../src/components/intake-section-a';
import {
  Body,
  Card,
  ErrorText,
  Eyebrow,
  GhostButton,
  Link,
  PrimaryButton,
  Screen,
  Title,
} from '../src/components/ui';
import { theme } from '../src/theme';

/**
 * Mobile intake — Section A (identity) only for the skeleton. Pre-fills the
 * Belgian Malinois × Dutch Shepherd default; "Start fresh" gives a blank form.
 * The richer B–E sections (history / living / current / goals) live on web for
 * now — the data model supports them, and a re-run on web adds them later.
 */
export default function Onboard() {
  const router = useRouter();
  const [useDefault, setUseDefault] = useState(true);
  const [profile, setProfile] = useState<DogProfileInput>(MAL_DUTCH_DEFAULT_PROFILE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDefault(next: boolean) {
    setUseDefault(next);
    setProfile(next ? MAL_DUTCH_DEFAULT_PROFILE : EMPTY_DEFAULT_PROFILE);
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      const dog = await dogs.create(profile);
      router.replace({ pathname: '/dogs/[id]', params: { id: dog.id } });
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof ApiError
          ? `${e.code}: ${e.message}`
          : e instanceof Error
            ? e.message
            : String(e),
      );
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ marginBottom: theme.space.md }}>
          <Eyebrow>Intake</Eyebrow>
          <View style={{ height: theme.space.sm }} />
          <Title>Tell us about your dog</Title>
          <View style={{ height: theme.space.sm }} />
          <Body>
            Identity now — the rest of intake (history, living, goals) is on the web app for now.
          </Body>
          <View style={{ height: theme.space.sm }} />
          <Link
            label={useDefault ? 'Start fresh →' : 'Use the example →'}
            onPress={() => toggleDefault(!useDefault)}
          />
        </View>
        <Card>
          <IntakeSectionA profile={profile} setProfile={setProfile} />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <View style={{ flexDirection: 'row', gap: theme.space.md, marginTop: theme.space.md }}>
            <View style={{ flex: 1 }}>
              <GhostButton label="Cancel" onPress={() => router.replace('/')} />
            </View>
            <View style={{ flex: 2 }}>
              <PrimaryButton
                label={busy ? 'Saving…' : 'Create dog'}
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

import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ApiError,
  type DogProfileInput,
  EMPTY_DEFAULT_PROFILE,
  MAL_DUTCH_DEFAULT_PROFILE,
} from '@ccc/shared';
import { dogs } from '../src/lib/dogs';
import { pickAndUploadPhoto } from '../src/lib/media';
import { IntakeSectionA } from '../src/components/intake-section-a';
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDefault(next: boolean) {
    setUseDefault(next);
    setProfile(next ? MAL_DUTCH_DEFAULT_PROFILE : EMPTY_DEFAULT_PROFILE);
    setPhotoUri(null);
  }

  async function onPickPhoto() {
    setPhotoBusy(true);
    setError(null);
    try {
      const picked = await pickAndUploadPhoto();
      if (picked) {
        setPhotoUri(picked.localUri);
        setProfile((p) => ({ ...p, photoMediaId: picked.media.id }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that photo.');
    } finally {
      setPhotoBusy(false);
    }
  }

  function onRemovePhoto() {
    setPhotoUri(null);
    setProfile((p) => ({ ...p, photoMediaId: null }));
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

  const hasPhoto = !!profile.photoMediaId;

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
          {/* Profile photo */}
          <View style={s.photoRow}>
            <View style={s.photoThumb}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={s.photoImg} />
              ) : (
                <Text style={s.photoPlaceholder}>🐾</Text>
              )}
            </View>
            <View style={{ flex: 1, gap: theme.space.xs }}>
              <Muted>Profile photo (optional)</Muted>
              <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
                <View style={{ flex: 1 }}>
                  <GhostButton
                    label={photoBusy ? 'Uploading…' : hasPhoto ? 'Change' : 'Add photo'}
                    onPress={onPickPhoto}
                  />
                </View>
                {hasPhoto ? (
                  <View style={{ flex: 1 }}>
                    <GhostButton label="Remove" onPress={onRemovePhoto} />
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={{ height: theme.space.md }} />
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
                disabled={profile.name.trim() === '' || photoBusy}
              />
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  photoThumb: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.steelMid,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: { fontSize: 24 },
});

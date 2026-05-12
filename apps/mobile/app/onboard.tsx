import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ApiError,
  type DogProfileInput,
  EMPTY_DEFAULT_PROFILE,
  type IntakeAnswers,
  MAL_DUTCH_DEFAULT_PROFILE,
} from '@ccc/shared';
import { conversations } from '../src/lib/conversations';
import { dogs } from '../src/lib/dogs';
import { IntakeSectionA } from '../src/components/intake-section-a';
import {
  SectionBHistory,
  SectionCLiving,
  SectionDCurrent,
  SectionEGoals,
} from '../src/components/intake-rich';
import { PhotoPickerRow } from '../src/components/photo-picker';
import {
  Body,
  Card,
  ErrorText,
  Eyebrow,
  GhostButton,
  Link,
  PrimaryButton,
  Screen,
} from '../src/components/ui';
import { theme } from '../src/theme';

/** Mal × Dutch Shepherd intake-answers seed — mirrors the web stepper default. */
const MAL_DUTCH_ANSWERS: IntakeAnswers = {
  living: { ownerActivityLevel: 'high', ownerDogExperience: 'experienced' },
  goals: { focusAreas: ['off-leash recall', 'calm settle'], minutesPerDay: 90 },
};

const STEPS = [
  { key: 'A', title: 'Identity', desc: 'Who is your dog?' },
  { key: 'B', title: 'Origin & history', desc: 'What do you know about their past?' },
  { key: 'C', title: 'Life situation', desc: 'Where and how do you live?' },
  { key: 'D', title: 'Current state', desc: 'What do they already know — and not?' },
  { key: 'E', title: 'Goals', desc: 'Where do you want to get to?' },
] as const;

/**
 * The full 5-section intake stepper. Section A (identity + photo) maps to the
 * Dog record; sections B–E (history / living / current / goals) become an
 * `intake_response`. Pre-fills the Belgian Malinois × Dutch Shepherd example;
 * "Start fresh" gives blank forms. On submit: create the dog, submit intake,
 * then drop the owner into a Scout chat anchored to the new dog.
 */
export default function Onboard() {
  const router = useRouter();
  const [useDefault, setUseDefault] = useState(true);
  const [profile, setProfile] = useState<DogProfileInput>(MAL_DUTCH_DEFAULT_PROFILE);
  const [answers, setAnswers] = useState<IntakeAnswers>(MAL_DUTCH_ANSWERS);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDefault(next: boolean) {
    setUseDefault(next);
    setProfile(next ? MAL_DUTCH_DEFAULT_PROFILE : EMPTY_DEFAULT_PROFILE);
    setAnswers(next ? MAL_DUTCH_ANSWERS : {});
    setStep(0);
  }

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      const dog = await dogs.create(profile);
      await dogs.submitIntake(dog.id, { answers });
      // "Meet Scout" — anchored chat, suggested prompts ready.
      const convo = await conversations.create({
        dogId: dog.id,
        title: `Getting started with ${dog.name}`,
      });
      router.replace({ pathname: '/scout/[id]', params: { id: convo.id } });
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

  const isLast = step === STEPS.length - 1;
  const cur = STEPS[step]!;
  const nextDisabled = busy || (step === 0 && profile.name.trim() === '');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ marginBottom: theme.space.md }}>
          <Eyebrow>Intake</Eyebrow>
          <View style={{ height: theme.space.sm }} />
          <Text style={s.title}>{cur.title}</Text>
          <View style={{ height: 4 }} />
          <Body>{cur.desc}</Body>
          <View style={{ height: theme.space.sm }} />
          <View style={s.metaRow}>
            <Text style={s.stepBadge}>
              Step {step + 1} / {STEPS.length} · Section {cur.key}
            </Text>
            <Link
              label={useDefault ? 'Start fresh →' : 'Use the example →'}
              onPress={() => toggleDefault(!useDefault)}
            />
          </View>
        </View>

        <Card>
          {step === 0 ? (
            <>
              <PhotoPickerRow
                mediaId={profile.photoMediaId}
                onChange={(id) => setProfile((p) => ({ ...p, photoMediaId: id }))}
              />
              <View style={{ height: theme.space.md }} />
              <IntakeSectionA profile={profile} setProfile={setProfile} />
            </>
          ) : null}
          {step === 1 ? <SectionBHistory answers={answers} setAnswers={setAnswers} /> : null}
          {step === 2 ? <SectionCLiving answers={answers} setAnswers={setAnswers} /> : null}
          {step === 3 ? <SectionDCurrent answers={answers} setAnswers={setAnswers} /> : null}
          {step === 4 ? <SectionEGoals answers={answers} setAnswers={setAnswers} /> : null}

          {error ? <ErrorText>{error}</ErrorText> : null}

          <View style={{ flexDirection: 'row', gap: theme.space.md, marginTop: theme.space.lg }}>
            {step > 0 ? (
              <View style={{ flex: 1 }}>
                <GhostButton label="Back" onPress={() => setStep((x) => Math.max(0, x - 1))} />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <GhostButton label="Cancel" onPress={() => router.replace('/')} />
              </View>
            )}
            <View style={{ flex: 2 }}>
              <PrimaryButton
                label={isLast ? (busy ? 'Saving…' : "Build this dog's plan") : 'Next'}
                onPress={() =>
                  isLast ? onSubmit() : setStep((x) => Math.min(STEPS.length - 1, x + 1))
                }
                loading={busy}
                disabled={nextDisabled}
              />
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: {
    color: theme.colors.cream,
    fontFamily: theme.font.display,
    fontSize: 34,
    letterSpacing: theme.tracking.normal,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  stepBadge: {
    color: theme.colors.textMuted,
    fontFamily: theme.font.mono,
    fontSize: theme.fontSize.micro,
    letterSpacing: theme.tracking.normal,
    textTransform: 'uppercase',
  },
});

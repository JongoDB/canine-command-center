import { View } from 'react-native';
import type { Breed, DogProfileInput, DogSex, DogSource, NeuterStatus } from '@ccc/shared';
import {
  FieldRow,
  MultilineInput,
  NumberFieldInput,
  OptionRow,
  StringInput,
  ToggleRow,
} from './intake-fields';
import { theme } from '../theme';

// ---------------------------------------------------------------------------
// Section A — identity
// ---------------------------------------------------------------------------

const SEX_OPTIONS: ReadonlyArray<{ value: DogSex; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'unknown', label: 'Unknown' },
];
const NEUTER_OPTIONS: ReadonlyArray<{ value: NeuterStatus; label: string }> = [
  { value: 'intact', label: 'Intact' },
  { value: 'spayed', label: 'Spayed' },
  { value: 'neutered', label: 'Neutered' },
  { value: 'unknown', label: 'Unknown' },
];
const SOURCE_OPTIONS: ReadonlyArray<{ value: DogSource; label: string }> = [
  { value: 'breeder', label: 'Breeder' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'stray', label: 'Stray' },
  { value: 'bred_by_me', label: 'Bred by me' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];
const BREED_KIND_OPTIONS: ReadonlyArray<{ value: Breed['kind']; label: string }> = [
  { value: 'pure', label: 'Pure' },
  { value: 'mix', label: 'Mix' },
  { value: 'unknown', label: 'Unknown' },
];

export function IntakeSectionA({
  profile,
  setProfile,
}: {
  profile: DogProfileInput;
  setProfile: (next: DogProfileInput) => void;
}) {
  const setP = (patch: Partial<DogProfileInput>) => setProfile({ ...profile, ...patch });
  const setBreed = (patch: Partial<Breed>) => setP({ breed: { ...profile.breed, ...patch } });

  return (
    <View>
      <FieldRow label="Name">
        <StringInput
          value={profile.name}
          onChangeText={(t) => setP({ name: t ?? '' })}
          autoCapitalize="words"
        />
      </FieldRow>

      <FieldRow label="Breed">
        <OptionRow
          value={profile.breed.kind}
          onChange={(k) => setBreed({ kind: k })}
          options={BREED_KIND_OPTIONS}
        />
      </FieldRow>
      {profile.breed.kind !== 'unknown' && (
        <FieldRow label="Primary breed">
          <StringInput
            value={profile.breed.primary ?? null}
            onChangeText={(t) => setBreed({ primary: t ?? undefined })}
            placeholder="e.g. Belgian Malinois"
          />
        </FieldRow>
      )}
      {profile.breed.kind === 'mix' && (
        <FieldRow label="Secondary breed">
          <StringInput
            value={profile.breed.secondary ?? null}
            onChangeText={(t) => setBreed({ secondary: t ?? undefined })}
            placeholder="e.g. Dutch Shepherd"
          />
        </FieldRow>
      )}
      <ToggleRow
        label="Is the breed a guess?"
        value={profile.breed.isGuess}
        onChange={(v) => setBreed({ isGuess: v })}
      />

      <FieldRow label="Sex">
        <OptionRow value={profile.sex} onChange={(v) => setP({ sex: v })} options={SEX_OPTIONS} />
      </FieldRow>
      <FieldRow label="Neuter status">
        <OptionRow
          value={profile.neuterStatus}
          onChange={(v) => setP({ neuterStatus: v })}
          options={NEUTER_OPTIONS}
        />
      </FieldRow>

      <FieldRow label="Birth date (YYYY-MM-DD)">
        <StringInput
          value={profile.birthDate}
          onChangeText={(t) => setP({ birthDate: t })}
          placeholder="e.g. 2025-12-01"
          keyboardType="numbers-and-punctuation"
        />
      </FieldRow>
      <ToggleRow
        label="Birth date is an estimate"
        value={profile.birthDateIsEstimate}
        onChange={(v) => setP({ birthDateIsEstimate: v })}
      />

      <FieldRow label="Weight (kg)">
        <NumberFieldInput
          value={profile.weightKg}
          onChange={(n) => setP({ weightKg: n })}
          placeholder="e.g. 12.5"
        />
      </FieldRow>
      <FieldRow label="Color">
        <StringInput value={profile.color} onChangeText={(t) => setP({ color: t })} />
      </FieldRow>
      <FieldRow label="Microchip">
        <StringInput value={profile.microchip} onChangeText={(t) => setP({ microchip: t })} />
      </FieldRow>

      <FieldRow label="Source">
        <OptionRow
          value={profile.source}
          onChange={(v) => setP({ source: v })}
          options={SOURCE_OPTIONS}
        />
      </FieldRow>
      <FieldRow label="Got them on (YYYY-MM-DD)">
        <StringInput
          value={profile.acquiredOn}
          onChangeText={(t) => setP({ acquiredOn: t })}
          placeholder="e.g. 2026-01-10"
          keyboardType="numbers-and-punctuation"
        />
      </FieldRow>
      <FieldRow label="Age (weeks) when you got them">
        <NumberFieldInput
          value={profile.acquiredAtAgeWeeks}
          onChange={(n) => setP({ acquiredAtAgeWeeks: n === null ? null : Math.round(n) })}
        />
      </FieldRow>

      <FieldRow label="Notes (anything else about identity / origin)">
        <MultilineInput value={profile.notes} onChange={(t) => setP({ notes: t })} rows={4} />
      </FieldRow>

      {/* spacer */}
      <View style={{ height: theme.space.xs }} />
    </View>
  );
}

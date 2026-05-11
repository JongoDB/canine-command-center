import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { Breed, DogProfileInput, DogSex, DogSource, NeuterStatus } from '@ccc/shared';
import { theme } from '../theme';

// ---------------------------------------------------------------------------
// Tiny field helpers (RN flavour)
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: theme.space.md }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </View>
  );
}

function StringInput({
  value,
  onChangeText,
  ...rest
}: {
  value: string | null | undefined;
  onChangeText: (s: string | null) => void;
} & Omit<ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'style'>) {
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={(t) => onChangeText(t === '' ? null : t)}
      placeholderTextColor={theme.colors.textMuted}
      autoCapitalize="none"
      {...rest}
      style={s.input}
    />
  );
}

function NumberFieldInput({
  value,
  onChange,
  ...rest
}: {
  value: number | null | undefined;
  onChange: (n: number | null) => void;
} & Omit<
  ComponentProps<typeof TextInput>,
  'value' | 'onChange' | 'onChangeText' | 'style' | 'keyboardType'
>) {
  return (
    <TextInput
      value={value === null || value === undefined ? '' : String(value)}
      keyboardType="decimal-pad"
      onChangeText={(t) => {
        if (t === '') return onChange(null);
        const n = Number(t.replace(',', '.'));
        if (Number.isFinite(n)) onChange(n);
      }}
      placeholderTextColor={theme.colors.textMuted}
      {...rest}
      style={s.input}
    />
  );
}

function MultilineInput({
  value,
  onChange,
  rows = 3,
}: {
  value: string | null | undefined;
  onChange: (s: string | null) => void;
  rows?: number;
}) {
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={(t) => onChange(t === '' ? null : t)}
      placeholderTextColor={theme.colors.textMuted}
      multiline
      numberOfLines={rows}
      style={[s.input, { minHeight: rows * 22 + 24, textAlignVertical: 'top' }]}
    />
  );
}

function OptionRow<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.pill, active && s.pillActive]}
          >
            <Text style={[s.pillText, active && s.pillTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.space.md,
      }}
    >
      <FieldLabel>{label}</FieldLabel>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.colors.steelMid, true: theme.colors.tan }}
        thumbColor={theme.colors.cream}
      />
    </View>
  );
}

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
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.wide,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.steelMid,
    borderWidth: 1,
    color: theme.colors.cream,
    fontSize: theme.fontSize.body,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.md,
  },
  pill: {
    borderColor: theme.colors.steelMid,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pillActive: {
    borderColor: theme.colors.tan,
    backgroundColor: theme.colors.steel,
  },
  pillText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.bodySm,
  },
  pillTextActive: {
    color: theme.colors.tanLight,
    fontWeight: theme.fontWeight.bold,
  },
});

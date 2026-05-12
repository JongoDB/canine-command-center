// Shared RN field primitives for the intake screens (Section A + the rich B–E
// sections). Mirrors the web `IntakeForm` field helpers, native flavour.
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: theme.space.md }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </View>
  );
}

export function StringInput({
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

export function NumberFieldInput({
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

export function MultilineInput({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string | null | undefined;
  onChange: (s: string | null) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={(t) => onChange(t === '' ? null : t)}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textMuted}
      multiline
      numberOfLines={rows}
      style={[s.input, { minHeight: rows * 22 + 24, textAlignVertical: 'top' }]}
    />
  );
}

/** Single-select chip row. */
export function OptionRow<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <View style={s.chips}>
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

/** Multi-select chip row (toggle each on/off). */
export function MultiSelectRow<T extends string>({
  values,
  onChange,
  options,
}: {
  values: readonly T[];
  onChange: (next: T[]) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  const set = new Set(values);
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const active = set.has(o.value);
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              const next = new Set(set);
              if (active) next.delete(o.value);
              else next.add(o.value);
              onChange(Array.from(next));
            }}
            style={[s.pill, active && s.pillActive]}
          >
            <Text style={[s.pillText, active && s.pillTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <View style={s.toggleRow}>
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

/** `["a","b"]` ⇄ multi-line text — for the array-valued intake fields. */
export const linesToArray = (text: string): string[] =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
export const arrayToLines = (a: string[] | undefined): string => (a ?? []).join('\n');

const s = StyleSheet.create({
  label: {
    color: theme.colors.textMuted,
    fontFamily: theme.font.mono,
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
    fontFamily: theme.font.body,
    fontSize: theme.fontSize.body,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, marginTop: 4 },
  pill: {
    borderColor: theme.colors.steelMid,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pillActive: { borderColor: theme.colors.tan, backgroundColor: theme.colors.steel },
  pillText: {
    color: theme.colors.textMuted,
    fontFamily: theme.font.body,
    fontSize: theme.fontSize.bodySm,
  },
  pillTextActive: {
    color: theme.colors.tanLight,
    fontFamily: theme.font.body,
    fontWeight: theme.fontWeight.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space.md,
  },
});

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, uiStyles } from '../theme';

/** Full-screen, safe-area, dark-fill container. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={uiStyles.screen}>
      <View style={s.screenPad}>{children}</View>
    </SafeAreaView>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={uiStyles.eyebrow}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={uiStyles.muted}>{children}</Text>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text style={s.error}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={[uiStyles.card, s.gap]}>{children}</View>;
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
        {...props}
        style={[uiStyles.input, props.style]}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        uiStyles.button,
        (disabled || loading) && s.disabled,
        pressed && s.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.black} />
      ) : (
        <Text style={uiStyles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.ghost, pressed && s.pressed]}>
      <Text style={s.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={s.link}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screenPad: { flex: 1, paddingHorizontal: theme.space.xl, paddingVertical: theme.space.lg },
  gap: { gap: theme.space.md },
  title: {
    color: theme.colors.cream,
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: theme.tracking.wide,
  },
  body: {
    color: theme.colors.cream,
    fontSize: theme.fontSize.body,
    lineHeight: 21,
    fontWeight: theme.fontWeight.light,
  },
  error: { color: theme.colors.accentLight, fontSize: theme.fontSize.bodySm },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.label,
    letterSpacing: theme.tracking.wide,
    textTransform: 'uppercase',
    marginBottom: theme.space.xs + 2,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  ghost: {
    borderColor: theme.colors.tan,
    borderWidth: 1,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
    alignItems: 'center',
    borderRadius: theme.radius.md,
  },
  ghostText: {
    color: theme.colors.tan,
    fontSize: theme.fontSize.bodySm,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: theme.tracking.wide,
    textTransform: 'uppercase',
  },
  link: { color: theme.colors.tan, fontSize: theme.fontSize.bodySm },
});

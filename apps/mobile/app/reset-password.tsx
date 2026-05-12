import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authClient } from '../src/lib/auth-client';
import {
  Body,
  Card,
  ErrorText,
  Eyebrow,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
  Title,
} from '../src/components/ui';
import { theme } from '../src/theme';

/**
 * Set a new password. Reached either from a deep link
 * (`caninecommandcenter://reset-password?token=…`, expo-router routes it here)
 * or by pasting the token from the reset email.
 */
export default function ResetPassword() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(tokenParam ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    if (!token.trim()) {
      setError('Paste the token from your reset email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await authClient.resetPassword({ newPassword: password, token: token.trim() });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Could not reset your password — the link may have expired.');
      return;
    }
    setDone(true);
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card>
          <View>
            <Eyebrow>Canine Command Center</Eyebrow>
            <View style={{ height: theme.space.sm }} />
            <Title>{done ? 'Password updated' : 'Set a new password'}</Title>
          </View>

          {done ? (
            <>
              <Body>Your password has been changed. Sign in with it.</Body>
              <PrimaryButton label="Sign in" onPress={() => router.replace('/sign-in')} />
            </>
          ) : (
            <>
              {!tokenParam ? (
                <Field
                  label="Reset token (from your email)"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoComplete="off"
                />
              ) : null}
              <Field
                label="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
              />
              {error ? <ErrorText>{error}</ErrorText> : null}
              <PrimaryButton
                label={busy ? 'Saving…' : 'Update password'}
                onPress={onSubmit}
                loading={busy}
                disabled={password.length < 8 || token.trim() === ''}
              />
              <GhostButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}

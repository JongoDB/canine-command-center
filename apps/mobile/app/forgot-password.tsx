import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { authClient } from '../src/lib/auth-client';
import {
  Body,
  Card,
  ErrorText,
  Eyebrow,
  Field,
  GhostButton,
  Link,
  PrimaryButton,
  Screen,
  Title,
} from '../src/components/ui';
import { APP_SCHEME } from '../src/lib/config';
import { theme } from '../src/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    const res = await authClient.requestPasswordReset({
      email,
      // Where the link in the email should land — this app's reset screen,
      // via the custom scheme (expo-router routes `/reset-password` here).
      // (The API currently builds the email link from WEB_BASE_URL, so this is
      // honoured once the server switches to the client-supplied target.)
      redirectTo: `${APP_SCHEME}://reset-password`,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Could not send the reset email.');
      return;
    }
    setSent(true);
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card>
          <View>
            <Eyebrow>Canine Command Center</Eyebrow>
            <View style={{ height: theme.space.sm }} />
            <Title>{sent ? 'Check your email' : 'Reset your password'}</Title>
          </View>

          {sent ? (
            <>
              <Body>
                If an account exists for {email}, a reset link is on its way. Open it (in your
                browser), set a new password, then sign in.
              </Body>
              <GhostButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
              <Link
                label="Open mailpit (dev)"
                onPress={() => void Linking.openURL('http://localhost:8025')}
              />
            </>
          ) : (
            <>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {error ? <ErrorText>{error}</ErrorText> : null}
              <PrimaryButton
                label={busy ? 'Sending…' : 'Send reset link'}
                onPress={onSubmit}
                loading={busy}
              />
              <Link label="Back to sign in" onPress={() => router.push('/sign-in')} />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}

import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { signUp } from '../src/lib/auth-client';
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
import { theme } from '../src/theme';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    const res = await signUp.email({ name, email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Sign-up failed.');
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
            <Title>{done ? 'Check your email' : 'Create your account'}</Title>
          </View>

          {done ? (
            <>
              <Body>
                We emailed a 6-digit code (and a link) to {email}. Enter the code to activate your
                account.
              </Body>
              <PrimaryButton
                label="Enter your code"
                onPress={() => router.push({ pathname: '/verify-email', params: { email } })}
              />
              <GhostButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
            </>
          ) : (
            <>
              <Field
                label="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
              {error ? <ErrorText>{error}</ErrorText> : null}
              <PrimaryButton
                label={busy ? 'Creating…' : 'Create account'}
                onPress={onSubmit}
                loading={busy}
              />
              <Link
                label="Already have an account? Sign in"
                onPress={() => router.push('/sign-in')}
              />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}

import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn } from '../src/lib/auth-client';
import {
  Card,
  ErrorText,
  Eyebrow,
  Field,
  Link,
  PrimaryButton,
  Screen,
  Title,
} from '../src/components/ui';
import { theme } from '../src/theme';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    const res = await signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      const msg = res.error.message ?? '';
      setError(
        /verif/i.test(res.error.code ?? '') || /verif/i.test(msg)
          ? 'Your email isn’t verified yet — check your inbox for the link.'
          : msg || 'Sign-in failed.',
      );
      return;
    }
    router.replace('/');
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card>
          <View>
            <Eyebrow>Canine Command Center</Eyebrow>
            <View style={{ height: theme.space.sm }} />
            <Title>Sign in</Title>
          </View>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton
            label={busy ? 'Signing in…' : 'Sign in'}
            onPress={onSubmit}
            loading={busy}
          />
          <View style={{ flexDirection: 'row', gap: theme.space.lg, flexWrap: 'wrap' }}>
            <Link label="Forgot password?" onPress={() => router.push('/forgot-password')} />
            <Link label="Create an account" onPress={() => router.push('/sign-up')} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

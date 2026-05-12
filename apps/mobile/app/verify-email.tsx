import { useEffect, useRef, useState } from 'react';
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
 * Verify the email with the 6-digit code from the verification email. The email
 * also carries a `caninecommandcenter://verify-email?email=…&code=…` link
 * (expo-router routes it here) — when both are present we submit automatically;
 * otherwise the owner types the code (handy when the email opened elsewhere).
 */
export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState((params.code ?? '').replace(/\D/g, '').slice(0, 6));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const autoTried = useRef(false);

  async function verify() {
    if (!email.trim() || code.length < 6) {
      setError('Enter your email and the 6-digit code from the email.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await authClient.emailOtp.verifyEmail({ email: email.trim(), otp: code });
    setBusy(false);
    if (res.error) {
      setError(
        res.error.message ?? 'That code didn’t work — it may have expired. Send a new one below.',
      );
      return;
    }
    router.replace('/');
  }

  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    if ((params.email ?? '').trim() && (params.code ?? '').replace(/\D/g, '').length === 6) {
      void verify();
    }
  }, [params.email, params.code]);

  async function resend() {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    setError(null);
    setResent(false);
    const res = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: 'email-verification',
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Could not send a new code.');
      return;
    }
    setResent(true);
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card>
          <View>
            <Eyebrow>Canine Command Center</Eyebrow>
            <View style={{ height: theme.space.sm }} />
            <Title>Verify your email</Title>
          </View>
          <Body>
            Enter the 6-digit code from the email — or open the link in it and we’ll fill it in.
          </Body>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="6-digit code"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          {resent ? <Body>A new code is on its way to {email}.</Body> : null}
          <PrimaryButton
            label={busy ? 'Verifying…' : 'Verify email'}
            onPress={verify}
            loading={busy}
            disabled={email.trim() === '' || code.length < 6}
          />
          <GhostButton label="Send a new code" onPress={resend} />
          <GhostButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
        </Card>
      </View>
    </Screen>
  );
}

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authClient } from '../src/lib/auth-client';
import {
  Body,
  Card,
  ErrorText,
  Eyebrow,
  GhostButton,
  Muted,
  PrimaryButton,
  Screen,
  Title,
} from '../src/components/ui';
import { theme } from '../src/theme';

/**
 * Landing screen for the email-verification link
 * (`caninecommandcenter://verify-email?token=…` — expo-router routes it here).
 * Calls the verify endpoint; on success the Expo auth client persists the new
 * session, so the app is signed in.
 */
export default function VerifyEmail() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [state, setState] = useState<'verifying' | 'ok' | 'error' | 'no-token'>(
    token ? 'verifying' : 'no-token',
  );
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    authClient
      .verifyEmail({ query: { token } })
      .then((res) => {
        if (!live) return;
        if (res.error) {
          setState('error');
          setMsg(res.error.message ?? 'This link may have expired.');
        } else {
          setState('ok');
        }
      })
      .catch((e: unknown) => {
        if (!live) return;
        setState('error');
        setMsg(e instanceof Error ? e.message : 'Verification failed.');
      });
    return () => {
      live = false;
    };
  }, [token]);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card>
          <View>
            <Eyebrow>Canine Command Center</Eyebrow>
            <View style={{ height: theme.space.sm }} />
            <Title>{state === 'ok' ? 'Email verified' : 'Verify your email'}</Title>
          </View>

          {state === 'verifying' ? <Muted>Confirming your address…</Muted> : null}
          {state === 'no-token' ? (
            <>
              <Body>This link is missing its token — use the link in your email again.</Body>
              <GhostButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
            </>
          ) : null}
          {state === 'ok' ? (
            <>
              <Body>You&apos;re all set — your email is confirmed and you&apos;re signed in.</Body>
              <PrimaryButton label="Continue" onPress={() => router.replace('/')} />
            </>
          ) : null}
          {state === 'error' ? (
            <>
              <ErrorText>{msg ?? 'Could not verify your email.'}</ErrorText>
              <GhostButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
            </>
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

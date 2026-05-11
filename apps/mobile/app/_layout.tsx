import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSession } from '../src/lib/auth-client';
import { theme } from '../src/theme';

const AUTH_ROUTES = new Set(['sign-in', 'sign-up', 'forgot-password']);

export default function RootLayout() {
  const { data, isPending } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    const onAuthRoute = AUTH_ROUTES.has(segments[0] ?? '');
    if (!data?.user && !onAuthRoute) router.replace('/sign-in');
    else if (data?.user && onAuthRoute) router.replace('/');
  }, [data, isPending, segments, router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.black },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}

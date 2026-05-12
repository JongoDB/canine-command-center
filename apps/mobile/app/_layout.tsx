import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSession } from '../src/lib/auth-client';
import { theme } from '../src/theme';

// Keep the native splash up until our fonts have loaded (no flash of system type).
void SplashScreen.preventAutoHideAsync();

// Routes reachable without a session (including the email deep-link landings).
const AUTH_ROUTES = new Set([
  'sign-in',
  'sign-up',
  'forgot-password',
  'reset-password',
  'verify-email',
]);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
    DMSans: require('../assets/fonts/DMSans.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { data, isPending } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (isPending) return;
    const onAuthRoute = AUTH_ROUTES.has(segments[0] ?? '');
    if (!data?.user && !onAuthRoute) router.replace('/sign-in');
    else if (data?.user && onAuthRoute) router.replace('/');
  }, [data, isPending, segments, router]);

  // Hold render until fonts are ready; the native splash stays up meanwhile.
  if (!fontsLoaded && !fontError) return null;

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

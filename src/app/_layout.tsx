import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/state/auth';
import { EntriesProvider } from '@/state/entries';
import { TransitionProvider } from '@/state/transition';
import { colors } from '@/theme/colors';

function Routes() {
  const { session, loading } = useAuth();
  if (loading) return null; // reading the stored session; avoids flashing the sign-in screen

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream }, animation: 'fade' }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="finish" />
        <Stack.Screen
          name="entry/[date]"
          options={{ animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right' }}
        />
        <Stack.Screen name="write" options={{ animation: Platform.OS === 'web' ? 'fade' : 'fade_from_bottom' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <EntriesProvider>
          <TransitionProvider>
            <Routes />
            <StatusBar style="dark" />
          </TransitionProvider>
        </EntriesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

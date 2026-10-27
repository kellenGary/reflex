import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/shared-components';
import { AuthProvider, useAuth } from '@/state/auth';
import { EntriesProvider } from '@/state/entries';
import { TransitionProvider } from '@/state/transition';
import { ThemeProvider, useTheme } from '@/state/theme';

function ThemedStatusBar() {
  return <StatusBar style={useTheme().isDark ? 'light' : 'dark'} />;
}

function Routes() {
  const { session, loading } = useAuth();
  const { palette } = useTheme();
  if (loading) return <LoadingScreen />; // reading the stored session; avoids flashing the sign-in screen

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.cream }, animation: 'fade' }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="finish" />
        <Stack.Screen name="safety" />
        <Stack.Screen name="week/[start]" />
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
      <ThemeProvider>
        <AuthProvider>
          <EntriesProvider>
            <TransitionProvider>
              <Routes />
              <ThemedStatusBar />
            </TransitionProvider>
          </EntriesProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

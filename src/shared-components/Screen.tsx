import type { ReactNode } from 'react';
import { Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

// Always reserve the scrollbar's space on web. Otherwise a long page (Home) has a scrollbar and a short
// one (Entry) doesn't, so the centered column shifts by the scrollbar's width when you navigate.
const alwaysScroll = (Platform.OS === 'web' ? { overflowY: 'scroll' } : {}) as unknown as ViewStyle;

/** Cream, safe-area-aware, scrolling page. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView style={[{ flex: 1 }, alwaysScroll]} keyboardShouldPersistTaps="handled">
        {children}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

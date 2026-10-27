import type { ReactNode } from 'react';
import { Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/state/theme';

// Always reserve the scrollbar's space on web. Otherwise a long page (Home) has a scrollbar and a short
// one (Entry) doesn't, so the centered column shifts by the scrollbar's width when you navigate.
const alwaysScroll = (Platform.OS === 'web' ? { overflowY: 'scroll' } : {}) as unknown as ViewStyle;

/**
 * Cream, safe-area-aware, scrolling page.
 * `inTabs`: this page is one of the four main tabs. On iPhone the system tab bar floats over the bottom of the screen
 * and adjusts the first scroll view's insets itself (top and bottom), so we must not also pad for the safe area.
 */
export function Screen({ children, inTabs }: { children: ReactNode; inTabs?: boolean }) {
  const { cream } = useColors();

  if (inTabs && Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1, backgroundColor: cream }}>
        <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
          {children}
          <View className="h-6" />
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cream }}>
      <ScrollView style={[{ flex: 1 }, alwaysScroll]} keyboardShouldPersistTaps="handled">
        {children}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';

import { AppNav } from './AppNav';
import { Wordmark } from './Wordmark';

/**
 * Top bar for the main screens: wordmark on the left, the section links on the right. 60px tall with 16px below.
 * `actions` (buttons for this page) sit in the same row, just before the links. When the row is too narrow for both
 * (a phone browser), they drop to their own right-aligned line under the bar instead.
 * On iPhone the system tab bar does the navigating, so the links are replaced by a Back link, but only on detail
 * pages that sit above the tabs (`back`).
 */
export function PageHeader({ back, actions }: { back?: boolean; actions?: ReactNode }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // The iPhone bar has only a wordmark and maybe a Back link, so there is room; elsewhere wait for tablet width.
  const inline = Platform.OS === 'ios' || width >= 640;
  const buttons = actions ? <View className="flex-row items-center gap-3">{actions}</View> : null;

  return (
    <View className="mb-4">
      <View className="h-[60px] flex-row items-center justify-between gap-4">
        <Wordmark />
        <View className="flex-row items-center gap-5">
          {inline && buttons}
          {Platform.OS !== 'ios' ? (
            <AppNav />
          ) : back ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              className="min-h-11 justify-center"
            >
              <Text className="text-[15px] text-muted">‹ Back</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {!inline && buttons && <View className="items-end pb-1">{buttons}</View>}
    </View>
  );
}

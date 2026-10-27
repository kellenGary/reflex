import { useRouter } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

import { AppNav } from './AppNav';
import { Wordmark } from './Wordmark';

/**
 * Top bar for the main screens: wordmark on the left, the section links on the right. 72px tall with 24px below.
 * On iPhone the system tab bar does the navigating, so the links are replaced by a Back link, but only on detail
 * pages that sit above the tabs (`back`).
 */
export function PageHeader({ back }: { back?: boolean }) {
  const router = useRouter();
  return (
    <View className="mb-6 h-[72px] flex-row items-center justify-between">
      <Wordmark />
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
  );
}

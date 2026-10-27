import { Text, View } from 'react-native';

import { useTween } from '@/lib/animation';
import { LoopingPlant } from './Plant';

/**
 * A breathing plant with an optional line of text. It fades in after a short pause, so a load that finishes quickly
 * never flashes it.
 */
export function LoadingBlock({ message, size = 150 }: { message?: string; size?: number }) {
  const show = useTween(500, 350);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
      className="items-center gap-3"
      style={{ opacity: show }}
    >
      <View style={{ width: size }}>
        <LoopingPlant />
      </View>
      {message && <Text className="text-[15px] text-muted">{message}</Text>}
    </View>
  );
}

/** Fills the screen on the page color, with the loader in the middle. */
export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-cream px-5">
      <LoadingBlock message={message} />
    </View>
  );
}

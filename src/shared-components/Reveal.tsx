import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTween } from '@/lib/animation';

/** Fades and lifts its children in after `delay` ms. */
export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: ViewStyle }) {
  const t = useTween(700, delay);
  return <View style={[{ opacity: t, transform: [{ translateY: (1 - t) * 10 }] }, style]}>{children}</View>;
}

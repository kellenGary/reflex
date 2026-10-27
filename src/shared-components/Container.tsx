import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Reading column inside a Container: the same 680px as the journal feed, centered below `lg` and flush left from `lg`
 * up, so single-column pages (Patterns, Settings) line up with Home.
 */
export function Column({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`w-full max-w-[680px] self-center lg:self-start ${className}`}>{children}</View>;
}

/** Centered page column used by every screen. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`w-full max-w-[1120px] self-center px-5 lg:px-8 ${className}`}>{children}</View>;
}

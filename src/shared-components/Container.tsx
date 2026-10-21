import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Centered page column used by every screen. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`w-full max-w-[1120px] self-center px-5 lg:px-8 ${className}`}>{children}</View>;
}

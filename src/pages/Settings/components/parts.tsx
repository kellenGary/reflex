import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useColors } from '@/state/theme';

/** A soft grouped panel with a small heading. Rows inside are separated by hairlines. */
export function Card({
  title,
  tone = 'default',
  children,
}: {
  title: string;
  tone?: 'default' | 'danger';
  children: ReactNode;
}) {
  const { shadow } = useColors();
  return (
    <View>
      <Text className="mb-2 ml-1 text-xs font-semibold uppercase tracking-widest text-muted">{title}</Text>
      <View
        className={`overflow-hidden rounded-3xl ${tone === 'danger' ? 'bg-roseSoft' : 'bg-surface'}`}
        style={{ shadowColor: shadow, shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } }}
      >
        {children}
      </View>
    </View>
  );
}

/** A title and a line of explanation, with the action beside it (below it on phones). */
export function Row({
  title,
  description,
  action,
  first,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  first?: boolean;
}) {
  return (
    <View
      className={`flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${first ? '' : 'border-t border-line'}`}
    >
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-ink">{title}</Text>
        {description && <Text className="max-w-[46ch] text-[15px] leading-[22px] text-body">{description}</Text>}
      </View>
      {action && <View className="flex-row">{action}</View>}
    </View>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-cream px-2 py-3">
      <Text className="text-2xl font-bold tracking-tight text-ink">{value}</Text>
      <Text className="mt-0.5 text-xs text-muted">{label}</Text>
    </View>
  );
}

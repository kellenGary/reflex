import { Text, View } from 'react-native';

import { useTweenedNumber } from '@/lib/animation';
import { describe, SIGNALS } from '@/lib/signals';
import type { Signal } from '@/lib/types';

type ScoreBarProps = {
  signal: Signal;
  value: number;
  size?: 'md' | 'lg';
  /** Start from this value on mount (e.g. 0 to fill in). Omit to render at `value` immediately. */
  from?: number;
  delay?: number;
};

/**
 * Label, plain-language band, number and a bar. The number and bar slide to the new value whenever
 * `value` changes (e.g. after an entry is edited and re-scored).
 */
export function ScoreBar({ signal, value, size = 'md', from, delay = 0 }: ScoreBarProps) {
  const shown = useTweenedNumber(value, 900, delay, from);
  const meta = SIGNALS.find((s) => s.key === signal)!;
  const big = size === 'lg';
  return (
    <View className="gap-2">
      {big ? (
        <>
          <Text className="text-sm text-muted">{meta.label}</Text>
          <View className="flex-row items-baseline gap-2.5">
            <Text className="text-[44px] font-bold leading-[46px] tracking-tighter text-ink">{Math.round(shown)}</Text>
            <Text className="text-sm text-body">{describe(signal, shown)}</Text>
          </View>
        </>
      ) : (
        <View className="flex-row items-baseline justify-between">
          <Text className="text-sm text-muted">{meta.label}</Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-sm text-body">{describe(signal, shown)}</Text>
            <Text className="text-[30px] font-bold leading-8 tracking-tight text-ink">{Math.round(shown)}</Text>
          </View>
        </View>
      )}
      <View className="h-1.5 rounded-[3px] bg-track">
        <View className="h-1.5 rounded-[3px]" style={{ width: `${Math.max(0, Math.min(100, shown))}%`, backgroundColor: meta.color }} />
      </View>
    </View>
  );
}

import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatLong, weekNumber, weekRangeLabel } from '@/lib/dates';
import { summarizeWeek } from '@/lib/summary';
import type { Entry } from '@/lib/types';
import type { PlantState } from '@/lib/plant';
import { MiniScores, Plant, Reveal } from '@/shared-components';
import { FirstEntryPrompt } from './FirstEntryPrompt';

export type FeedGroup = { weekStart: string; entries: Entry[]; current: boolean; plant: PlantState };

function WeekDivider({ group }: { group: FeedGroup }) {
  const label = group.current
    ? `Week ${weekNumber(group.weekStart)}, in progress`
    : `Week ${weekNumber(group.weekStart)}, ${weekRangeLabel(group.weekStart)}`;
  return (
    <View className="flex-row items-center gap-4 border-t border-line pb-6 pt-2">
      <View className="w-40" accessibilityLabel={`Plant for week ${weekNumber(group.weekStart)}`}>
        <Plant tight state={group.plant} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</Text>
        <Text className="max-w-[52ch] text-[15px] leading-[22px] text-body">{summarizeWeek(group.entries)}</Text>
      </View>
    </View>
  );
}

function FeedEntry({ entry, delay }: { entry: Entry; delay?: number }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/entry/[date]', params: { date: entry.date } })}
      className="pb-9 hover:opacity-70"
    >
      <View className="mb-2.5 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-ink">{formatLong(entry.date)}</Text>
        <MiniScores scores={entry.scores} delay={delay === undefined ? undefined : delay + 200} />
      </View>
      <Text numberOfLines={3} className="max-w-[60ch] text-base leading-6 text-ink opacity-65">
        {entry.text.replace(/\n+/g, ' ')}
      </Text>
    </Pressable>
  );
}

export function Feed({ groups }: { groups: FeedGroup[] }) {
  let order = 0;
  return (
    <View>
      <View className="flex-row flex-wrap items-baseline justify-between gap-4 pb-7">
        <Text className="text-4xl font-bold tracking-tighter text-ink">Journal</Text>
        <View className="flex-row gap-3.5">
          {[
            ['Depression', 'bg-depression'],
            ['Anxiety', 'bg-anxiety'],
            ['Meaning', 'bg-meaning'],
          ].map(([label, dot]) => (
            <View key={label} className="flex-row items-center gap-1.5">
              <View className={`h-2 w-2 rounded-sm ${dot}`} />
              <Text className="text-[13px] text-muted">{label}</Text>
            </View>
          ))}
        </View>
      </View>
      {groups.length === 0 && <FirstEntryPrompt />}
      {groups.map((group) => (
        <View key={group.weekStart}>
          <WeekDivider group={group} />
          {group.entries.map((entry) => {
            const n = order++;
            // Only the first screenful staggers in; the rest render plainly (fewer running animations).
            return n < 8 ? (
              <Reveal key={entry.date} delay={150 + n * 90}>
                <FeedEntry entry={entry} delay={150 + n * 90} />
              </Reveal>
            ) : (
              <FeedEntry key={entry.date} entry={entry} />
            );
          })}
        </View>
      ))}
    </View>
  );
}

import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatLong } from '@/lib/dates';
import { splitMatches } from '@/lib/search';
import type { Entry } from '@/lib/types';
import { MiniScores } from './MiniScores';

/**
 * One entry in a list: date, tiny score bars, and a faded excerpt. Opens the entry.
 * For search results, pass the passage to show and the query to mark in it.
 */
export function EntryRow({
  entry,
  delay,
  excerpt,
  highlight,
}: {
  entry: Entry;
  delay?: number;
  excerpt?: string;
  highlight?: string;
}) {
  const router = useRouter();
  const shown = excerpt ?? entry.text.replace(/\n+/g, ' ');
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
        {(highlight ? splitMatches(shown, highlight) : [{ text: shown, match: false }]).map((p, i) =>
          p.match ? (
            <Text key={i} className="bg-sun text-ink">
              {p.text}
            </Text>
          ) : (
            p.text
          ),
        )}
      </Text>
    </Pressable>
  );
}

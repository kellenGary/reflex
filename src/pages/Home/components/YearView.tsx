import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatLong } from '@/lib/dates';
import { feelingLabel } from '@/lib/feeling';
import { heatColor, heatRamp, type Metric } from '@/lib/heat';
import { Segmented } from '@/shared-components';
import { useEntries } from '@/state/entries';
import { useColors } from '@/state/theme';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const pad = (n: number) => String(n).padStart(2, '0');

const OPTIONS: { value: Metric; label: string }[] = [
  { value: 'overall', label: 'Overall' },
  { value: 'depression', label: 'Depression' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'meaning', label: 'Meaning' },
];

const LEGEND: Record<Metric, [string, string]> = {
  overall: ['A harder day', 'An easier day'],
  depression: ['Lower', 'Higher'],
  anxiety: ['Lower', 'Higher'],
  meaning: ['Lower', 'Higher'],
};

/** The whole year as twelve small months, each day colored by how it read. Tap a day to open it. */
export function YearView() {
  const router = useRouter();
  const { entries, today } = useEntries();
  const { track, ink, muted } = useColors();
  const thisYear = Number(today.slice(0, 4));
  const firstYear = entries.length ? Math.min(...entries.map((e) => Number(e.date.slice(0, 4)))) : thisYear;
  const [year, setYear] = useState(thisYear);
  const [metric, setMetric] = useState<Metric>('overall');
  const [hover, setHover] = useState<string | null>(null);

  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const written = entries.filter((e) => e.date.startsWith(`${year}-`)).length;
  const hovered = hover ? byDate.get(hover) : undefined;
  const [low, high] = LEGEND[metric];

  return (
    <View>
      <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row items-center gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous year"
            disabled={year <= firstYear}
            onPress={() => setYear(year - 1)}
            className={`h-11 w-9 items-center justify-center ${year <= firstYear ? 'opacity-30' : ''}`}
          >
            <Text className="text-2xl text-muted">‹</Text>
          </Pressable>
          <Text className="min-w-[56px] text-center text-lg font-semibold text-ink">{year}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next year"
            disabled={year >= thisYear}
            onPress={() => setYear(year + 1)}
            className={`h-11 w-9 items-center justify-center ${year >= thisYear ? 'opacity-30' : ''}`}
          >
            <Text className="text-2xl text-muted">›</Text>
          </Pressable>
          <Text className="ml-2 text-sm text-muted">
            {written} {written === 1 ? 'day' : 'days'} written
          </Text>
        </View>
      </View>

      <Segmented value={metric} onChange={setMetric} options={OPTIONS} />

      <View className="-mx-2 mt-4 flex-row flex-wrap">
        {MONTHS.map((name, m) => {
          const days = new Date(year, m + 1, 0).getDate();
          const lead = (new Date(year, m, 1).getDay() + 6) % 7; // weeks start on Monday
          return (
            <View key={name} className="w-1/2 p-2 sm:w-1/3">
              <Text className="mb-1.5 text-xs font-semibold text-muted">{name}</Text>
              <View className="flex-row flex-wrap">
                {Array.from({ length: lead }, (_, i) => (
                  <View key={`b${i}`} className="w-[14.2857%]" />
                ))}
                {Array.from({ length: days }, (_, i) => {
                  const date = `${year}-${pad(m + 1)}-${pad(i + 1)}`;
                  const entry = byDate.get(date);
                  const future = date > today;
                  const isToday = date === today;
                  return (
                    <View key={date} className="w-[14.2857%] p-[1.5px]">
                      <Pressable
                        accessibilityRole={entry ? 'link' : undefined}
                        accessibilityLabel={entry ? formatLong(date) : undefined}
                        disabled={!entry}
                        onPress={() => entry && router.push({ pathname: '/entry/[date]', params: { date } })}
                        onPointerEnter={() => setHover(date)}
                        onPointerLeave={() => setHover(null)}
                        className="aspect-square rounded-[4px]"
                        style={{
                          backgroundColor: entry ? heatColor(metric, entry.scores, track) : track,
                          opacity: entry ? 1 : future ? 0.25 : 0.55,
                          borderWidth: isToday ? 1.5 : 0,
                          borderColor: ink,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      <View className="mt-3 min-h-[44px] justify-center rounded-xl bg-track px-4 py-2.5">
        {hovered ? (
          <Text className="text-sm leading-5 text-ink">
            {formatLong(hovered.date)}
            {hovered.feeling !== null ? ` · you felt ${feelingLabel(hovered.feeling).toLowerCase()}` : ''}
            {` · Depression ${hovered.scores.depression} · Anxiety ${hovered.scores.anxiety} · Meaning ${hovered.scores.meaning}`}
          </Text>
        ) : (
          <Text className="text-sm text-muted">Tap a day to open it.</Text>
        )}
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <Text className="text-xs text-muted">{low}</Text>
        {heatRamp(metric, track).map((c, i) => (
          <View key={i} className="h-3 w-6 rounded-[3px]" style={{ backgroundColor: c }} />
        ))}
        <Text className="text-xs text-muted">{high}</Text>
        <View
          className="ml-3 h-3 w-3 rounded-[3px]"
          style={{ backgroundColor: track, borderWidth: 1, borderColor: muted }}
        />
        <Text className="text-xs text-muted">No entry</Text>
      </View>
    </View>
  );
}

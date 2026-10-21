import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';

import { addDays, formatLong, formatShort, weekNumber } from '@/lib/dates';
import { dailySeries } from '@/lib/series';
import { SIGNALS } from '@/lib/signals';
import { Button, Container, Reveal, Screen, ScoreBar, Switch, TrendChart, Wordmark } from '@/shared-components';
import { saveErrorMessage } from '@/services/api';
import { useEntries } from '@/state/entries';
import { HighlightedText } from './components/HighlightedText';

const sticky = (Platform.OS === 'web' ? { position: 'sticky', top: 24 } : undefined) as unknown as
  ViewStyle | undefined;
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as TextStyle;

function DayArrow({ label, glyph, onPress }: { label: string; glyph: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center ${onPress ? '' : 'opacity-30'}`}
    >
      <Text className="text-2xl text-muted">{glyph}</Text>
    </Pressable>
  );
}

export function EntryPage() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { status, entries, today, getEntry, updateEntry } = useEntries();
  const entry = date ? getEntry(date) : undefined;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShaped, setShowShaped] = useState(false);

  if (status !== 'ready') return null;
  if (!entry) return <Redirect href="/" />;

  const goTo = (d: string) => router.replace({ pathname: '/entry/[date]', params: { date: d } });
  const idx = entries.findIndex((e) => e.date === entry.date); // entries are newest first
  const older = entries[idx + 1]?.date;
  const newer = entries[idx - 1]?.date;

  const startEdit = () => {
    setDraft(entry.text);
    setEditing(true);
  };
  const save = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateEntry(entry.date, draft.trim());
      setEditing(false);
    } catch (e) {
      setError(saveErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // 14-day window containing the entry, ending no later than today.
  const endKey = addDays(entry.date, 7) > today ? today : addDays(entry.date, 7);
  const series = dailySeries(entries, endKey, 14);
  const markerIndex = series.keys.indexOf(entry.date);
  const shapedSignals = SIGNALS.filter((s) => entry.highlights.some((h) => h.signal === s.key));

  return (
    <Screen>
      <Container>
        <View className="h-[72px] flex-row items-center justify-between">
          <Wordmark />
          <View className="flex-row items-center gap-5">
            <Pressable
              accessibilityRole="link"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              className="min-h-11 justify-center"
            >
              <Text className="text-sm text-muted">‹ Back to journal</Text>
            </Pressable>
            {editing ? (
              <>
                <Button
                  variant="ghost"
                  label="Cancel"
                  onPress={() => {
                    setEditing(false);
                    setError(null);
                  }}
                />
                <Button label={saving ? 'Scoring…' : 'Save'} onPress={save} disabled={!draft.trim() || saving} />
              </>
            ) : (
              <Button variant="ghost" label="Edit" onPress={startEdit} />
            )}
          </View>
        </View>

        <View className="mt-10 flex-col gap-12 lg:flex-row lg:items-start lg:gap-[72px]">
          <View className="w-full min-w-0 max-w-[680px] lg:flex-1">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted">
              Week {weekNumber(entry.date)}
            </Text>
            <View className="-ml-3 mt-2 flex-row items-center gap-1.5">
              <DayArrow label="Previous entry" glyph="‹" onPress={older ? () => goTo(older) : undefined} />
              <Text
                accessibilityRole="header"
                className="flex-shrink text-4xl font-bold leading-[42px] tracking-tighter text-ink lg:text-[42px] lg:leading-[46px]"
              >
                {formatLong(entry.date)}
              </Text>
              <DayArrow label="Next entry" glyph="›" onPress={newer ? () => goTo(newer) : undefined} />
            </View>

            <Reveal key={`${entry.date}-${editing}`} style={{ marginTop: 32 }}>
              {editing ? (
                <TextInput
                  autoFocus
                  multiline
                  value={draft}
                  onChangeText={setDraft}
                  scrollEnabled={false}
                  accessibilityLabel="Edit entry"
                  className="min-h-[240px] text-[19px] leading-8 text-ink"
                  style={[{ textAlignVertical: 'top' }, noOutline]}
                />
              ) : (
                <HighlightedText text={entry.text} highlights={entry.highlights} show={showShaped} />
              )}
            </Reveal>
            {error && (
              <Text accessibilityRole="alert" className="mt-4 text-sm leading-5 text-[#A4442E]">
                {error}
              </Text>
            )}
          </View>

          <View className="w-full pt-1 lg:w-[340px]" style={sticky}>
            <Text className="mb-5 text-[15px] font-semibold text-ink">How it scored</Text>
            <View className="gap-5">
              {SIGNALS.map((s, i) => (
                <ScoreBar key={s.key} signal={s.key} value={entry.scores[s.key]} from={0} delay={250 + i * 150} />
              ))}
            </View>

            <View className="mt-7 border-t border-line pt-6">
              <View className="mb-3 flex-row items-baseline justify-between">
                <Text className="text-[15px] font-semibold text-ink">Where this sits</Text>
                <Text className="text-xs text-muted">14 days around this entry</Text>
              </View>
              <TrendChart
                key={entry.date}
                animateOnMount
                labelFor={formatLong}
                series={series}
                markerIndex={markerIndex >= 0 ? markerIndex : undefined}
              />
              <View className="mt-1 flex-row justify-between">
                <Text className="text-[11px] text-muted">{formatShort(series.keys[0])}</Text>
                <Text className="text-[11px] font-semibold text-ink">{formatShort(entry.date)}</Text>
                <Text className="text-[11px] text-muted">{endKey === today ? 'Today' : formatShort(endKey)}</Text>
              </View>
            </View>

            <View className="mt-7 border-t border-line pt-3">
              <Switch label="Show what shaped this" value={showShaped} onChange={setShowShaped} />
              {showShaped && (
                <View className="mt-3 flex-row">
                  {shapedSignals.length === 0 ? (
                    <Text className="text-[13px] text-muted">No standout phrases in this entry.</Text>
                  ) : (
                    shapedSignals.map((s) => (
                      <View key={s.key} className="mr-4 flex-row items-center gap-2">
                        <View className="w-[18px] border-t-2" style={{ borderColor: s.color }} />
                        <Text className="text-[13px] text-body">{s.label}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Container>
    </Screen>
  );
}

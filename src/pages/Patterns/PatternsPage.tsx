import { useState } from 'react';
import { Text, View } from 'react-native';

import { hasThemes, headlines, MIN_DAYS, themePatterns } from '@/lib/patterns';
import { SIGNALS } from '@/lib/signals';
import { themeLabel } from '@/lib/themes';
import { api } from '@/services/api';
import { Button, Column, Container, PageHeader, Reveal, Screen, LoadingScreen } from '@/shared-components';
import { useEntries } from '@/state/entries';
import { DeltaBar } from './components/DeltaBar';

export function PatternsPage() {
  const { status, entries, reload } = useEntries();
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);
  if (status !== 'ready') return <LoadingScreen />;

  const tagged = hasThemes(entries);
  const patterns = themePatterns(entries);
  const lines = headlines(patterns);

  const analyse = async () => {
    setWorking(true);
    setFailed(false);
    try {
      for (;;) {
        const { more } = await api.refreshInsights();
        if (!more) break;
      }
      reload();
    } catch {
      setFailed(true);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Screen inTabs>
      <Container>
        <PageHeader />
        <Column className="pb-16">
          <Text accessibilityRole="header" className="text-4xl font-bold tracking-normal text-ink">
            Patterns
          </Text>
          <Text className="mt-2 max-w-[56ch] text-base leading-6 text-muted">
            What you write about, and how those days read compared with your other days. These are links, not causes.
          </Text>

          {entries.length === 0 ? (
            <Text className="mt-10 text-base text-muted">Patterns appear once you have written a few entries.</Text>
          ) : !tagged ? (
            <Reveal style={{ marginTop: 32 }}>
              <View className="gap-4 rounded-3xl bg-surface p-6">
                <Text className="text-base leading-6 text-body">
                  Your entries have not been read for themes yet. This takes a moment, and does not change any scores.
                </Text>
                {failed && <Text className="text-sm text-roseInk">That did not work. Please try again.</Text>}
                <View className="flex-row">
                  <Button
                    label={working ? 'Reading your entries…' : 'Find my patterns'}
                    onPress={analyse}
                    disabled={working}
                  />
                </View>
              </View>
            </Reveal>
          ) : patterns.length === 0 ? (
            <Text className="mt-10 max-w-[52ch] text-base leading-6 text-muted">
              Not enough yet. A theme needs at least {MIN_DAYS} days with it and {MIN_DAYS} without before it can be
              compared. Keep writing.
            </Text>
          ) : (
            <>
              {lines.length > 0 && (
                <Reveal style={{ marginTop: 28 }}>
                  <View className="gap-3 rounded-3xl bg-sun p-6">
                    {lines.map((line) => (
                      <Text key={line} className="text-base leading-6 text-ink">
                        {line}
                      </Text>
                    ))}
                  </View>
                </Reveal>
              )}

              <View className="mt-10">
                <View className="mb-3 flex-row items-end gap-3">
                  <View className="w-24 sm:w-32" />
                  {SIGNALS.map((s) => (
                    <View key={s.key} className="flex-1 flex-row items-center justify-center gap-1">
                      <View className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                      <Text className="text-[11px] text-muted sm:text-xs">{s.label}</Text>
                    </View>
                  ))}
                </View>
                {patterns.map((p, i) => (
                  <Reveal key={p.theme} delay={Math.min(i, 8) * 70}>
                    <View className="flex-row items-center gap-3 border-t border-line py-4">
                      <View className="w-24 sm:w-32">
                        <Text className="text-[15px] font-semibold text-ink">{themeLabel(p.theme)}</Text>
                        <Text className="text-xs text-muted">{p.days} days</Text>
                      </View>
                      {SIGNALS.map((s) => (
                        <DeltaBar key={s.key} value={p.delta[s.key]} color={s.color} label={s.label} />
                      ))}
                    </View>
                  </Reveal>
                ))}
              </View>
              <Text className="mt-6 max-w-[56ch] text-[13px] leading-5 text-muted">
                Each bar is the average score on days with the theme minus the average on days without it. Right means
                higher, left means lower.
              </Text>
            </>
          )}
        </Column>
      </Container>
    </Screen>
  );
}

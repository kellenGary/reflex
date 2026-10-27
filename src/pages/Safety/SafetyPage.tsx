import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, ScrollView, Text, View } from 'react-native';

import { BloomBackground, Button, Reveal, Wordmark, LoadingScreen } from '@/shared-components';
import { useEntries } from '@/state/entries';
import { useColors } from '@/state/theme';

/**
 * Shown, calmly and before any scores, when an entry contains crisis language. Also reachable later from the
 * entry itself. It never labels the person; it offers support and lets them carry on at their own pace.
 */
export function SafetyPage() {
  const router = useRouter();
  const { shadow } = useColors();
  const { date, then } = useLocalSearchParams<{ date: string; then?: string }>();
  const { status, getEntry } = useEntries();
  if (status !== 'ready') return <LoadingScreen />;
  const entry = date ? getEntry(date) : undefined;
  if (!entry) return <Redirect href="/" />;

  const next = () =>
    then === 'finish'
      ? router.replace({ pathname: '/finish', params: { date: entry.date } })
      : router.replace({ pathname: '/entry/[date]', params: { date: entry.date } });

  return (
    <View className="flex-1 bg-cream">
      <BloomBackground />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[560px] px-5 py-10">
          <Wordmark />
          <Reveal delay={200} style={{ marginTop: 40 }}>
            <Text
              accessibilityRole="header"
              className="text-[32px] font-bold leading-9 tracking-normal text-ink sm:text-[40px] sm:leading-[44px]"
            >
              Thank you for writing that down.
            </Text>
            <Text className="mt-4 text-lg leading-7 text-body">
              Some of what you wrote sounds really heavy. You do not have to carry it alone, and you do not have to be
              sure it counts as an emergency before you reach out.
            </Text>
          </Reveal>

          <Reveal delay={600} style={{ marginTop: 28 }}>
            <View
              className="gap-4 rounded-3xl bg-surface p-6"
              style={{
                shadowColor: shadow,
                shadowOpacity: 0.08,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 8 },
              }}
            >
              <Text className="text-[15px] font-semibold text-ink">In the United States</Text>
              <Text className="text-[15px] leading-[22px] text-body">
                Call or text 988 to reach the Suicide &amp; Crisis Lifeline. It is free, confidential, and open all day
                and night.
              </Text>
              <View className="flex-row flex-wrap gap-3">
                <Button label="Call 988" onPress={() => Linking.openURL('tel:988')} />
                <Button variant="ghost" label="Text 988" onPress={() => Linking.openURL('sms:988')} />
              </View>
              <View className="mt-1 border-t border-line pt-4">
                <Text className="text-[15px] font-semibold text-ink">Somewhere else</Text>
                <Text className="mt-1 text-[15px] leading-[22px] text-body">
                  findahelpline.com lists free, confidential lines by country.
                </Text>
                <View className="mt-3 flex-row">
                  <Button
                    variant="ghost"
                    label="Find a helpline"
                    onPress={() => Linking.openURL('https://findahelpline.com')}
                  />
                </View>
              </View>
              <Text className="text-[13px] leading-5 text-muted">
                If you might act on these thoughts soon, call your local emergency number.
              </Text>
            </View>
          </Reveal>

          <Reveal delay={900} style={{ marginTop: 24 }}>
            <Text className="text-sm leading-5 text-muted">
              This app can only read what you write. It cannot respond in the moment, and it is not a substitute for a
              person who can.
            </Text>
            <View className="mt-5 flex-row flex-wrap gap-3">
              <Button size="lg" label={then === 'finish' ? 'Continue' : 'Back to my entry'} onPress={next} />
            </View>
          </Reveal>
        </View>
      </ScrollView>
    </View>
  );
}

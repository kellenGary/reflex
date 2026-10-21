import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import { useIsWide } from '@/lib/breakpoints';
import { weekStartKey } from '@/lib/dates';
import { plantStateForWeek } from '@/lib/plant';
import { Button, Container, Reveal, Screen, Wordmark } from '@/shared-components';
import { useAuth } from '@/state/auth';
import { useEntries } from '@/state/entries';
import { Feed, type FeedGroup } from './components/Feed';
import { Sidebar } from './components/Sidebar';

const introSent = new Set<string>();

// position: sticky is web-only; react-native-web passes it through.
const sticky = (Platform.OS === 'web' ? { position: 'sticky', top: 24 } : undefined) as unknown as
  ViewStyle | undefined;

export function HomePage() {
  const { status, errorKind, reload, entries, today } = useEntries();
  const { session, signOut } = useAuth();
  const router = useRouter();
  const isWide = useIsWide();
  const userId = session?.user.id;
  const isNewUser = status === 'ready' && entries.length === 0;

  // A brand-new user starts by writing today's entry. Once per user per app load, so Close still reaches Home.
  useEffect(() => {
    if (!isNewUser || !userId || introSent.has(userId)) return;
    introSent.add(userId);
    router.replace('/write');
  }, [isNewUser, userId, router]);

  const groups = useMemo<FeedGroup[]>(() => {
    const map = new Map<string, FeedGroup>();
    for (const entry of entries) {
      const weekStart = weekStartKey(entry.date);
      if (!map.has(weekStart))
        map.set(weekStart, {
          weekStart,
          entries: [],
          current: weekStart === weekStartKey(today),
          plant: plantStateForWeek(entries, weekStart),
        });
      map.get(weekStart)!.entries.push(entry);
    }
    return [...map.values()];
  }, [entries, today]);

  if (status !== 'ready') {
    return (
      <Screen>
        <Container>
          <View className="h-[72px] justify-center">
            <Wordmark />
          </View>
          <View className="items-center gap-4 pt-24">
            {status === 'error' ? (
              <>
                <Text className="max-w-[420px] text-center text-base leading-6 text-body">
                  {errorKind === 'network'
                    ? "We can't reach the reflex server."
                    : errorKind === 'auth'
                      ? 'Your session has expired. Please sign in again.'
                      : "We couldn't load your journal."}
                </Text>
                {errorKind === 'network' && __DEV__ && (
                  <Text className="max-w-[420px] text-center text-sm leading-5 text-muted">
                    Is it running? Start it with &quot;npm run dev&quot; in the server folder.
                  </Text>
                )}
                {errorKind === 'auth' ? (
                  <Button label="Sign out" onPress={signOut} />
                ) : (
                  <Button label="Try again" onPress={reload} />
                )}
              </>
            ) : (
              <Text className="text-base text-muted">Loading your journal…</Text>
            )}
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen>
      <Container>
        <View className="h-[72px] flex-row items-center justify-between">
          <Wordmark />
          <Pressable accessibilityRole="button" onPress={signOut} className="min-h-11 justify-center">
            <Text className="text-sm text-muted">Sign out</Text>
          </Pressable>
        </View>
        <View className="mt-6 flex-col-reverse items-center gap-12 lg:flex-row lg:items-start lg:gap-[72px]">
          <View className="w-full max-w-[680px] lg:flex-1">
            <Feed groups={groups} />
          </View>
          <View className="w-full max-w-[680px] lg:w-[340px] lg:max-w-[340px]" style={isWide ? sticky : undefined}>
            <Reveal delay={100}>
              <Sidebar />
            </Reveal>
          </View>
        </View>
      </Container>
    </Screen>
  );
}

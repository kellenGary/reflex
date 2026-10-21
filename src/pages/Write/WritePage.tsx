import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatLong } from '@/lib/dates';
import { BloomBackground, Button, Reveal, Wordmark } from '@/shared-components';
import { saveErrorMessage } from '@/services/api';
import { useEntries } from '@/state/entries';
import { colors } from '@/theme/colors';
import { PROMPTS } from './prompts';

// Borderless editor: remove the browser's focus ring on web.
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as TextStyle;

export function WritePage() {
  const router = useRouter();
  const { status, entries, today, getEntry, addEntry } = useEntries();
  const [text, setText] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'ready') return null; // wait for entries so we know whether today is already written

  // One entry per day: if today is already written, go read it instead.
  // (Not while saving: adding the entry makes it exist, and we're about to go to /finish.)
  if (!saving && getEntry(today)) return <Redirect href={{ pathname: '/entry/[date]', params: { date: today } }} />;

  const firstEntry = entries.length === 0;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const finish = async () => {
    if (!words || saving) return;
    setSaving(true);
    setError(null);
    try {
      const entry = await addEntry(text.trim());
      router.replace({ pathname: '/finish', params: { date: entry.date } });
    } catch (e) {
      setError(saveErrorMessage(e));
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <BloomBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <View className="h-[72px] flex-row items-center justify-between px-5 lg:px-8">
          <Wordmark />
          <View className="flex-row items-center gap-5">
            <Pressable accessibilityRole="button" onPress={close} className="min-h-11 justify-center">
              <Text className="text-sm text-muted">Close</Text>
            </Pressable>
            <Button label={saving ? 'Scoring…' : 'Finish entry'} onPress={finish} disabled={!words || saving} />
          </View>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-[680px] gap-3.5 self-center px-5 pt-16 lg:px-8 lg:pt-24">
            {firstEntry && (
              <Reveal delay={500}>
                <Text className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
                  Welcome. Your first entry
                </Text>
              </Reveal>
            )}
            <Reveal delay={600}>
              <Text
                accessibilityRole="header"
                className="text-[42px] font-bold leading-[46px] tracking-tighter text-ink"
              >
                {formatLong(today)}
              </Text>
            </Reveal>
            <View className="flex-row items-center gap-2.5">
              <Text className="flex-shrink text-xl leading-7 text-muted">{PROMPTS[promptIndex]}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="New prompt"
                onPress={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}
                className="h-11 w-11 items-center justify-center"
              >
                <Text className="text-lg text-muted">↻</Text>
              </Pressable>
            </View>
            {firstEntry && (
              <Reveal delay={900}>
                <Text className="max-w-[52ch] text-base leading-6 text-body">
                  There is no right way to do this. Write a few lines about today, however it went. When you finish, you
                  will see how it read.
                </Text>
              </Reveal>
            )}
            <TextInput
              autoFocus
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Start writing…"
              placeholderTextColor="#B8B29B"
              accessibilityLabel="Today's entry"
              scrollEnabled={false}
              className="mt-6 min-h-[360px] text-[19px] leading-8 text-ink"
              style={[{ textAlignVertical: 'top' }, noOutline]}
            />
          </View>
        </ScrollView>

        <View className="min-h-10 flex-row items-center justify-between gap-4 px-5 lg:px-8">
          <Text accessibilityRole="alert" className="flex-1 text-xs text-[#A4442E]">
            {error}
          </Text>
          <Text className="text-xs text-muted">
            {words} {words === 1 ? 'word' : 'words'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

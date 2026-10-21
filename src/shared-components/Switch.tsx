import { Pressable, Text, View } from 'react-native';

import { useTweenedNumber } from '@/lib/animation';

type SwitchProps = { label: string; value: boolean; onChange: (value: boolean) => void };

export function Switch({ label, value, onChange }: SwitchProps) {
  const left = useTweenedNumber(value ? 21 : 3, 220);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className="min-h-11 flex-row items-center justify-between gap-4"
    >
      <Text className="text-[15px] text-ink">{label}</Text>
      <View className={`h-[26px] w-11 rounded-[13px] ${value ? 'bg-ink' : 'bg-[#D9D0B6]'}`}>
        <View className="absolute top-[3px] h-5 w-5 rounded-full bg-cream" style={{ left }} />
      </View>
    </Pressable>
  );
}

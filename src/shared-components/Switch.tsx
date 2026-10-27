import { Pressable, Text, View } from 'react-native';

import { useTweenedNumber } from '@/lib/animation';

type SwitchProps = {
  /** Shown beside the switch. Omit when the switch sits in a row that already has a title, and pass `accessibilityLabel`. */
  label?: string;
  accessibilityLabel?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function Switch({ label, accessibilityLabel, value, onChange }: SwitchProps) {
  const left = useTweenedNumber(value ? 21 : 3, 220);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className={`min-h-11 flex-row items-center gap-4 ${label ? 'justify-between' : 'justify-end'}`}
    >
      {label && <Text className="text-[15px] text-ink">{label}</Text>}
      <View className={`h-[26px] w-11 rounded-[13px] ${value ? 'bg-ink' : 'bg-edge'}`}>
        <View className="absolute top-[3px] h-5 w-5 rounded-full bg-cream" style={{ left }} />
      </View>
    </Pressable>
  );
}

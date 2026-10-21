import { Pressable, Text, View } from 'react-native';

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row gap-0.5" accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            className={`rounded-full px-2.5 py-1 ${active ? 'bg-ink' : ''}`}
          >
            <Text className={`text-xs font-semibold ${active ? 'text-cream' : 'text-muted'}`}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

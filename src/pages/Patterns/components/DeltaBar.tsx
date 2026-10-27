import { Text, View } from 'react-native';

const RANGE = 25; // a gap this big fills the bar

/** A difference from the usual, drawn left (lower) or right (higher) of a centre line, with the signed number. */
export function DeltaBar({ value, color, label }: { value: number; color: string; label: string }) {
  const pct = Math.min(1, Math.abs(value) / RANGE) * 50;
  return (
    <View
      className="flex-1 gap-1"
      accessibilityLabel={`${label} ${value >= 0 ? 'higher' : 'lower'} by ${Math.abs(value)}`}
    >
      <View className="h-2 justify-center rounded-full bg-track">
        <View className="absolute h-3 w-px self-center bg-muted" />
        <View
          className="absolute h-2 rounded-full"
          style={{ backgroundColor: color, width: `${pct}%`, left: value >= 0 ? '50%' : `${50 - pct}%` }}
        />
      </View>
      <Text className="text-center text-xs text-body">
        {value > 0 ? '+' : value < 0 ? '−' : ''}
        {Math.abs(value)}
      </Text>
    </View>
  );
}

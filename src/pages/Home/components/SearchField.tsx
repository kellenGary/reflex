import { Platform, Pressable, TextInput, View, type TextStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useColors } from '@/state/theme';

const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as TextStyle;

export function SearchIcon({ size = 18 }: { size?: number }) {
  const { ink } = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={10.5} cy={10.5} r={6.5} stroke={ink} strokeWidth={2} />
      <Line x1={15.5} y1={15.5} x2={20} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * The search field that opens from the magnifier in the Journal header. The × on the right clears what you typed,
 * and when the field is empty it closes the whole thing. Escape closes it too.
 */
export function SearchField({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const { hint, muted } = useColors();
  return (
    <View className="h-11 flex-row items-center rounded-xl border border-line bg-surface pl-3.5">
      <SearchIcon size={16} />
      <TextInput
        autoFocus
        value={value}
        onChangeText={onChange}
        onKeyPress={(e) => e.nativeEvent.key === 'Escape' && onClose()}
        placeholder="Search your entries"
        placeholderTextColor={hint}
        accessibilityLabel="Search your entries"
        returnKeyType="search"
        autoCorrect={false}
        className="h-full flex-1 px-2.5 text-base text-ink"
        style={noOutline}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? 'Clear search' : 'Close search'}
        onPress={() => (value ? onChange('') : onClose())}
        className="h-11 w-11 items-center justify-center hover:opacity-70"
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M5 5l14 14M19 5L5 19" stroke={muted} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

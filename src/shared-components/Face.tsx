import Svg, { Circle, Path } from 'react-native-svg';

import { useColors, useTheme } from '@/state/theme';

// Soft fill for each step, rough to great.
const FILLS = ['#E3C2AE', '#EAD7B0', '#EEE4BA', '#D8E5BB', '#BCD79C'];
const MOUTHS = [
  'M12.5 27 Q20 19.5 27.5 27',
  'M13 26.2 Q20 22 27 26.2',
  'M13.5 25 L26.5 25',
  'M13 23.2 Q20 28.5 27 23.2',
  'M12 22.2 Q20 32 28 22.2',
];

/** A simple drawn face for one of the five feelings. */
export function Face({ level, size = 40, selected }: { level: number; size?: number; selected?: boolean }) {
  const { ink, cream } = useColors();
  const { isDark } = useTheme();
  const i = Math.max(1, Math.min(5, level)) - 1;
  // Same softening the plant gets in dark mode, so faces don't glare.
  const fill = isDark ? mixHex(FILLS[i], cream, 0.3) : FILLS[i];
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel={`Feeling ${level} of 5`}>
      {selected && <Circle cx={20} cy={20} r={19} fill="none" stroke={ink} strokeWidth={1.4} />}
      <Circle cx={20} cy={20} r={selected ? 16 : 17} fill={fill} stroke={ink} strokeWidth={1.4} />
      <Circle cx={14.5} cy={16} r={1.7} fill={ink} />
      <Circle cx={25.5} cy={16} r={1.7} fill={ink} />
      <Path d={MOUTHS[i]} fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
  return `#${pa
    .map((c, k) =>
      Math.round(c + (pb[k] - c) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

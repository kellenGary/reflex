import Svg, { Circle, Path } from 'react-native-svg';

import { useColors } from '@/state/theme';

/**
 * The app's mark: the emoticon ":(:" turned a quarter turn, so it reads top to bottom as a pair of dots (eyes),
 * an arch (a frown), and a second pair of dots. Drawn in the text color so it suits light and dark pages.
 */
export function FaceMark({ size = 24 }: { size?: number }) {
  const { ink } = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={8.4} cy={5.73} r={2} fill={ink} />
      <Circle cx={15.6} cy={5.73} r={2} fill={ink} />
      <Path d="M6 13.77 C8 9.17 16 9.17 18 13.77" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={8.4} cy={18.27} r={2} fill={ink} />
      <Circle cx={15.6} cy={18.27} r={2} fill={ink} />
    </Svg>
  );
}

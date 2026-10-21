import { Platform, View, type ViewStyle } from 'react-native';

import { useTween } from '@/lib/animation';
import { colors } from '@/theme/colors';

const BLOBS = [
  { size: 520, color: colors.blobSage, delay: 0, pos: { left: -120, bottom: -80 } },
  { size: 460, color: colors.blobYellow, delay: 150, pos: { right: -100, top: -140 } },
  { size: 420, color: colors.blobPeach, delay: 300, pos: { right: 160, bottom: -200 } },
];

// CSS blur is web-only; on native the blobs stay as soft low-opacity circles.
const blur = (Platform.OS === 'web' ? { filter: 'blur(70px)' } : {}) as unknown as ViewStyle;

function Blob({ size, color, delay, pos }: (typeof BLOBS)[number]) {
  const t = useTween(2800, delay);
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.95 - 0.65 * t,
          transform: [{ scale: 0.1 + 0.9 * t }],
        },
        pos,
        blur,
      ]}
    />
  );
}

/** Soft color blobs that bloom outward on open, then settle into a faint wash behind the page. */
export function BloomBackground() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}>
      {BLOBS.map((b, i) => (
        <Blob key={i} {...b} />
      ))}
    </View>
  );
}

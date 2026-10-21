import Svg, { Rect } from 'react-native-svg';

import { useTween } from '@/lib/animation';

import { SIGNALS } from '@/lib/signals';
import type { Scores } from '@/lib/types';

const H = 18;

/** Tiny three-bar mark: depression, anxiety, meaning. No numbers. */
export function MiniScores({ scores, delay }: { scores: Scores; delay?: number }) {
  const grow = useTween(700, delay ?? 0);
  const t = delay === undefined ? 1 : grow;
  const summary = SIGNALS.map((s) => `${s.label} ${describeShort(scores[s.key])}`).join(', ');
  return (
    <Svg width={30} height={H} viewBox={`0 0 30 ${H}`} accessibilityLabel={`Scores: ${summary}`}>
      {SIGNALS.map((s, i) => {
        const h = Math.max(2, Math.round(scores[s.key] * 0.16 * t));
        return <Rect key={s.key} x={i * 11} y={H - h} width={8} height={h} rx={2} fill={s.color} />;
      })}
    </Svg>
  );
}

const describeShort = (v: number) => (v <= 25 ? 'low' : v <= 50 ? 'mid' : 'high');

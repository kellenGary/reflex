import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

import { useTween } from '@/lib/animation';
import { smoothPath } from '@/lib/chart';
import { formatShort } from '@/lib/dates';
import { SIGNALS } from '@/lib/signals';
import type { Series } from '@/lib/series';
import { useColors } from '@/state/theme';

type TrendChartProps = {
  series: Series;
  height?: number;
  /** Index into the series to mark with a dashed line and dots. */
  markerIndex?: number;
  /** 0-1 left-to-right reveal, for the "drawing" animation. Defaults to fully drawn. */
  reveal?: number;
  /** Show a dot on the last point of each line (once fully revealed). */
  endDots?: boolean;
  /** Draw the lines in on mount (and again whenever the component remounts, e.g. via `key`). */
  animateOnMount?: boolean;
  /** Title for the hover tooltip, from a series key (a date, or a week start). */
  labelFor?: (key: string) => string;
};

const PAD_X = 10;
const PAD_Y = 14;
const TIP_W = 148;

export function TrendChart({
  series,
  height = 170,
  markerIndex,
  reveal: revealProp,
  endDots,
  animateOnMount,
  labelFor = formatShort,
}: TrendChartProps) {
  const colors = useColors();
  const drawn = useTween(1400, 150);
  const reveal = revealProp ?? (animateOnMount ? drawn : 1);
  const [width, setWidth] = useState(320);
  const [hover, setHover] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.max(120, e.nativeEvent.layout.width));

  const n = series.keys.length;
  const x = (i: number) => PAD_X + (n <= 1 ? 0 : (i * (width - PAD_X * 2)) / (n - 1));
  const y = (v: number) => PAD_Y + (1 - v / 100) * (height - PAD_Y * 2);

  const lines = SIGNALS.map((s) => {
    const points: [number, number][] = [];
    series.values[s.key].forEach((v, i) => {
      if (v !== null) points.push([x(i), y(v)]);
    });
    return { ...s, points };
  });

  const hasData = (i: number) => SIGNALS.some((s) => series.values[s.key][i] !== null);

  // Nearest point (by x) that has any data, so gaps don't leave the tooltip empty.
  const pick = (e: { nativeEvent: object }) => {
    const ev = e.nativeEvent as {
      offsetX?: number;
      locationX?: number;
    };
    const px = ev.offsetX ?? ev.locationX;
    if (px === undefined || n === 0) return;
    const raw = Math.round(((px - PAD_X) / (width - PAD_X * 2)) * (n - 1));
    const guess = Math.max(0, Math.min(n - 1, raw));
    for (let d = 0; d < n; d++) {
      for (const i of [guess - d, guess + d]) {
        if (i >= 0 && i < n && hasData(i)) return setHover(i);
      }
    }
  };
  const clear = () => setHover(null);

  const dotsAt = (i: number, key: string) =>
    lines.map((l) => {
      const v = series.values[l.key][i];
      return v === null ? null : (
        <Circle key={`${key}${l.key}`} cx={x(i)} cy={y(v)} r={4} fill={l.color} stroke={colors.cream} strokeWidth={2} />
      );
    });

  const tipLeft = hover === null ? 0 : x(hover) + 14 + TIP_W > width ? x(hover) - 14 - TIP_W : x(hover) + 14;

  return (
    <View
      onLayout={onLayout}
      style={{ width: '100%', height }}
      onPointerMove={pick}
      onPointerDown={pick}
      onPointerLeave={clear}
      onTouchStart={pick}
      onTouchMove={pick}
      onTouchEnd={clear}
      onTouchCancel={clear}
    >
      <View pointerEvents="none">
        <Svg width={width} height={height} accessibilityLabel="Trend of depression, anxiety and meaning scores">
          <Defs>
            <ClipPath id="reveal">
              <Rect x={0} y={0} width={width * reveal} height={height} />
            </ClipPath>
          </Defs>
          {[0.1, 0.5, 0.9].map((f) => (
            <Line key={f} x1={0} x2={width} y1={height * f} y2={height * f} stroke={colors.track} strokeWidth={1} />
          ))}
          {markerIndex !== undefined && (
            <Line
              x1={x(markerIndex)}
              x2={x(markerIndex)}
              y1={4}
              y2={height - 4}
              stroke={colors.ink}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          )}
          {hover !== null && (
            <Line x1={x(hover)} x2={x(hover)} y1={4} y2={height - 4} stroke={colors.muted} strokeWidth={1} />
          )}
          <G clipPath="url(#reveal)">
            {lines.map((l) => (
              <Path
                key={l.key}
                d={smoothPath(l.points)}
                fill="none"
                stroke={l.color}
                strokeWidth={l.key === 'meaning' ? 2.5 : 2}
                strokeLinecap="round"
              />
            ))}
          </G>
          {markerIndex !== undefined && dotsAt(markerIndex, 'm')}
          {hover !== null && dotsAt(hover, 'h')}
          {endDots &&
            reveal >= 1 &&
            lines.map((l) => {
              const last = l.points[l.points.length - 1];
              return last ? <Circle key={l.key} cx={last[0]} cy={last[1]} r={4.5} fill={l.color} /> : null;
            })}
        </Svg>
      </View>

      {hover !== null && (
        <View
          pointerEvents="none"
          className="absolute top-1 gap-1 rounded-[10px] border border-line bg-cream px-3 py-2"
          style={{
            left: tipLeft,
            width: TIP_W,
            shadowColor: colors.shadow,
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text className="text-xs font-semibold text-ink">{labelFor(series.keys[hover])}</Text>
          {SIGNALS.map((s) => {
            const v = series.values[s.key][hover];
            return v === null ? null : (
              <View key={s.key} className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                  <Text className="text-xs text-muted">{s.label}</Text>
                </View>
                <Text className="text-xs font-semibold text-ink">{Math.round(v)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

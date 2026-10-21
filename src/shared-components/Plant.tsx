import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

import { useSway, useTweenedNumber } from '@/lib/animation';
import { vitalityLabel, type PlantState } from '@/lib/plant';
import { colors } from '@/theme/colors';

/*
 * The week's plant, drawn procedurally from four 0-1 values:
 *   growth  -> stem height, number and size of leaves, buds and blooms
 *   tension -> (anxiety) narrower, more upright, creased leaves; a kinked stem; a faster, jumpier sway
 *   droop   -> (depression) leaves hang, yellow then brown at the tips, the stem bows, lower leaves drop
 *   carry   -> (last week) sturdier stem, richer soil, a new shoot at the base
 * All coordinates are in a 300x220 viewBox; the stem base sits at (150, 176).
 */

const GROUND = 176;
const MAX_H = 148;
const NODES = 10;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const f = (n: number) => n.toFixed(1);

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((c, i) => Math.round(c + (pb[i] - c) * clamp01(t)).toString(16).padStart(2, '0')).join('')}`;
}

/** Healthy green -> yellow -> brown as droop rises. */
function wilt(base: string, droop: number): string {
  return mix(mix(base, '#D9CC82', droop * 1.6), '#B8976A', (droop - 0.55) * 2);
}

const stemX = (h: number, tension: number, droop: number) => {
  const u = h / MAX_H;
  return 150 + 7 * Math.sin(u * 3.1) + droop * 34 * u * u + tension * 2.6 * Math.sin(u * 31) * u;
};
const stemY = (h: number) => GROUND - h;

type LeafProps = {
  x: number;
  y: number;
  rot: number;
  len: number;
  side: 1 | -1;
  fill: string;
  droop: number;
  tension: number;
};

function Leaf({ x, y, rot, len: L, side, fill, droop, tension }: LeafProps) {
  if (L < 3) return null;
  const hw = L * 0.3 * (1 - tension * 0.4);
  const tipY = side * droop * 0.38 * L;
  const upper = `C${f(0.2 * L)} ${f(-hw * 0.95 + tipY * 0.1)} ${f(0.7 * L)} ${f(-hw + tipY * 0.6)} ${f(L)} ${f(tipY)}`;
  const lower = `C${f(0.7 * L)} ${f(hw + tipY * 0.6)} ${f(0.2 * L)} ${f(hw * 0.95 + tipY * 0.1)} 0 0`;
  const midrib = `M0 0 Q${f(0.5 * L)} ${f(tipY * 0.3)} ${f(L)} ${f(tipY)}`;
  const midY = (fr: number) => tipY * (0.6 * fr + 0.4 * fr * fr);
  const veinFracs = L > 24 ? [0.25, 0.45, 0.65] : [0.3, 0.55];
  const patch = clamp01((droop - 0.35) * 1.2) * 0.75;

  return (
    <G transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)})`}>
      <Path d={`M0 0 ${upper} ${lower}Z`} fill={fill} stroke={colors.ink} strokeWidth={1.1} strokeLinejoin="round" />
      {/* shaded lower half */}
      <Path d={`${midrib} ${lower}Z`} fill={colors.ink} opacity={0.09} />
      {/* browning at the tip */}
      {patch > 0.02 && (
        <Path
          d={`M${f(0.66 * L)} ${f(-hw * 0.7 + tipY * 0.45)} C${f(0.85 * L)} ${f(-hw * 0.5 + tipY * 0.8)} ${f(0.97 * L)} ${f(tipY * 0.9)} ${f(L)} ${f(tipY)} C${f(0.97 * L)} ${f(tipY + hw * 0.1)} ${f(0.85 * L)} ${f(hw * 0.5 + tipY * 0.8)} ${f(0.66 * L)} ${f(hw * 0.7 + tipY * 0.45)}Z`}
          fill="#8B6B45"
          opacity={patch}
        />
      )}
      <Path d={midrib} fill="none" stroke={colors.ink} strokeWidth={0.9} strokeLinecap="round" />
      {veinFracs.map((fr) => {
        const by = midY(fr);
        const spread = hw * 0.72 * (1 - fr * 0.55);
        return (
          <G key={fr}>
            <Line x1={f(fr * L)} y1={f(by)} x2={f(fr * L + 0.17 * L)} y2={f(by - spread)} stroke={colors.ink} strokeWidth={0.6} strokeLinecap="round" />
            <Line x1={f(fr * L)} y1={f(by)} x2={f(fr * L + 0.17 * L)} y2={f(by + spread)} stroke={colors.ink} strokeWidth={0.6} strokeLinecap="round" />
          </G>
        );
      })}
      {/* creases from tension */}
      {tension > 0.45 && (
        <Path
          d={`M${f(0.34 * L)} ${f(-hw * 0.55)} Q${f(0.4 * L)} 0 ${f(0.32 * L)} ${f(hw * 0.5)}`}
          fill="none"
          stroke={colors.ink}
          strokeWidth={0.7}
          opacity={0.55}
        />
      )}
    </G>
  );
}

function Flower({ x, y, s }: { x: number; y: number; s: number }) {
  const petal = (k: number, scale: number, fill: string) => (
    <Ellipse
      key={`${scale}-${k}`}
      cx={0}
      cy={-11 * s * scale}
      rx={4.6 * s * scale}
      ry={10.5 * s * scale}
      fill={fill}
      stroke={colors.ink}
      strokeWidth={0.9}
      transform={`rotate(${k * 45 + (scale < 1 ? 22.5 : 0)})`}
    />
  );
  return (
    <G transform={`translate(${f(x)} ${f(y)})`}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => petal(k, 1, '#FBF3D9'))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => petal(k, 0.62, '#F6E7B8'))}
      <Circle r={5.6 * s} fill="#F1DE92" stroke={colors.ink} strokeWidth={1} />
      {[[-1.8, -1.2], [1.6, -1.8], [0.4, 1.8], [-1.4, 1.4], [2, 0.8]].map(([dx, dy], i) => (
        <Circle key={i} cx={dx * s} cy={dy * s} r={0.55 * s} fill={colors.ink} opacity={0.6} />
      ))}
    </G>
  );
}

function Bud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${f(x)} ${f(y)}) scale(${f(s)})`}>
      <Path d="M0 0 C-7 -6 -6 -18 0 -24 C6 -18 7 -6 0 0Z" fill="#F6E7B8" stroke={colors.ink} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d="M0 -2 C-2 -9 -2 -16 0 -22" fill="none" stroke={colors.ink} strokeWidth={0.6} opacity={0.6} />
      <Path d="M-6 -4 C-11 -8 -10 -13 -8 -15 C-6 -11 -5 -8 -2 -5Z" fill={colors.leafMid} stroke={colors.ink} strokeWidth={0.9} strokeLinejoin="round" />
      <Path d="M6 -4 C11 -8 10 -13 8 -15 C6 -11 5 -8 2 -5Z" fill={colors.leafMid} stroke={colors.ink} strokeWidth={0.9} strokeLinejoin="round" />
    </G>
  );
}

type Live = Omit<PlantState, 'vitality'>;

function PlantDrawing({ growth: g, tension: a, droop: d, carry: c, tight }: Live & { tight?: boolean }) {
  const H = 34 + (MAX_H - 34) * g;
  const size = 0.62 + 0.45 * g;
  const stemColor = mix('#98B27A', '#C9B88A', d);
  const stemW = 1.8 + 2.2 * c;
  const lost = d < 0.3 ? 0 : Math.min(3, Math.ceil(((d - 0.3) / 0.7) * 3));

  const px = (h: number) => stemX(h, a, d);
  const stemPoints: [number, number][] = [];
  for (let h = 0; h < H; h += 4) stemPoints.push([px(h), stemY(h)]);
  stemPoints.push([px(H), stemY(H)]);
  const toPath = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join(' ');
  const split = Math.max(2, Math.round(stemPoints.length * 0.6));

  // leaves along the main stem
  const leaves: ReactNode[] = [];
  for (let i = lost; i < NODES; i++) {
    const h = 20 + i * 13;
    const frac = clamp01((H - 8 - h) / 14);
    if (frac <= 0) break;
    const side: 1 | -1 = i % 2 ? 1 : -1;
    const u = h / MAX_H;
    const ang = Math.max(18, Math.min(168, 64 - a * 26 + d * 78 * (1.15 - 0.55 * u)));
    const rot = -90 + side * ang;
    const pet = 7 + 3 * size;
    const x0 = px(h);
    const y0 = stemY(h);
    const ox = x0 + pet * Math.cos((rot * Math.PI) / 180);
    const oy = y0 + pet * Math.sin((rot * Math.PI) / 180);
    const len = 46 * size * (1.08 - 0.45 * u) * frac;
    const base = i % 2 ? colors.leafLight : colors.leafMid;
    leaves.push(
      <G key={`l${i}`}>
        <Line x1={f(x0)} y1={f(y0)} x2={f(ox)} y2={f(oy)} stroke={colors.ink} strokeWidth={1} strokeLinecap="round" />
        <Leaf x={ox} y={oy} rot={rot} len={len} side={side} fill={wilt(base, d)} droop={d} tension={a} />
      </G>,
    );
  }

  // side branches appear as the plant grows
  const branches: ReactNode[] = [];
  [
    { h: 38, side: -1 as const, need: 0.25 },
    { h: 66, side: 1 as const, need: 0.45 },
    { h: 92, side: -1 as const, need: 0.65 },
  ].forEach(({ h, side, need }, i) => {
    const fr = clamp01((g - need) / 0.2);
    if (fr <= 0 || h > H - 12) return;
    const sx = px(h);
    const sy = stemY(h);
    const ex = sx + side * (22 + 10 * fr) * fr;
    const ey = sy - 14 * fr + d * 18 * fr;
    const cx = sx + side * 14 * fr;
    const cy = sy - 18 * fr;
    const path = `M${f(sx)} ${f(sy)} Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`;
    const ang = 55 + d * 62;
    branches.push(
      <G key={`b${i}`}>
        <Path d={path} fill="none" stroke={colors.ink} strokeWidth={stemW * 0.55 + 2} strokeLinecap="round" />
        <Path d={path} fill="none" stroke={stemColor} strokeWidth={stemW * 0.55} strokeLinecap="round" />
        <Leaf x={ex} y={ey} rot={-90 + side * ang} len={30 * size * fr} side={side} fill={wilt(colors.leafLight, d)} droop={d} tension={a} />
        <Leaf x={(sx + ex) / 2} y={(sy + ey) / 2 - 3} rot={-90 - side * (ang - 20)} len={20 * size * fr} side={(-side) as 1 | -1} fill={wilt(colors.leafMid, d)} droop={d} tension={a} />
      </G>,
    );
  });

  // crown: bloom when healthy, otherwise new growth
  const topX = px(H);
  const topY = stemY(H);
  const bloom = clamp01((g - 0.55) / 0.35) * clamp01(1 - d * 1.4);
  let crown: ReactNode;
  if (bloom > 0.55) crown = <Flower x={topX} y={topY - 5} s={0.55 + 0.6 * ((bloom - 0.55) / 0.45)} />;
  else if (bloom > 0.05) crown = <Bud x={topX} y={topY + 2} s={0.5 + bloom} />;
  else {
    const L = 24 * size;
    crown = (
      <G>
        <Leaf x={topX} y={topY} rot={-90 - 38} len={L} side={-1} fill={wilt(colors.leafNew, d)} droop={d} tension={a} />
        <Leaf x={topX} y={topY} rot={-90 + 38} len={L} side={1} fill={wilt(colors.leafNew, d)} droop={d} tension={a} />
      </G>
    );
  }

  const soil = mix('#B39B76', '#6E5A3E', c);
  const shootFr = clamp01((c - 0.45) / 0.3);
  const fallen = [
    { x: 92, y: 206, rot: 8, side: 1 as const },
    { x: 214, y: 207, rot: 172, side: -1 as const },
    { x: 76, y: 208, rot: -14, side: 1 as const },
  ].slice(0, lost);

  return (
    <Svg
      width="100%"
      viewBox={tight ? '52 0 200 214' : '0 0 300 220'}
      style={{ aspectRatio: tight ? 200 / 214 : 300 / 220 }}
      accessibilityLabel={`Plant for the week, ${vitalityLabel(g).toLowerCase()}`}
    >
      <Ellipse cx={150} cy={209} rx={64} ry={5} fill={colors.track} />
      {fallen.map((l, i) => (
        <Leaf key={`f${i}`} x={l.x} y={l.y} rot={l.rot} len={26} side={l.side} fill="#B8976A" droop={0.9} tension={0} />
      ))}

      {/* pot */}
      <Path d="M114 178h72l-8 30h-56z" fill={colors.pot} stroke={colors.ink} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M170 181 L186 181 L178 208 L168 208Z" fill={colors.ink} opacity={0.07} />
      <Line x1={122} y1={184} x2={127} y2={205} stroke="#FFFBEF" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <Path d="M119 191h62M121 198h58" stroke={colors.ink} strokeWidth={0.6} opacity={0.3} />
      <Path d="M109 172h82v9h-82z" fill={colors.potRim} stroke={colors.ink} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M109 177h82" stroke={colors.ink} strokeWidth={0.5} opacity={0.3} />
      {/* soil */}
      <Ellipse cx={150} cy={173} rx={37} ry={4.5} fill={soil} stroke={colors.ink} strokeWidth={0.9} />
      {[[128, 173], [136, 175], [143, 172], [161, 175], [170, 173], [177, 174], [152, 176]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={0.9} fill={colors.ink} opacity={0.35} />
      ))}

      {/* new shoot at the base, from a strong last week */}
      {shootFr > 0 && (
        <G>
          <Path d={`M128 173 Q127 ${f(173 - 10 * shootFr)} ${f(130 - 2 * shootFr)} ${f(173 - 17 * shootFr)}`} fill="none" stroke={colors.ink} strokeWidth={1.1} strokeLinecap="round" />
          <Leaf x={129} y={173 - 14 * shootFr} rot={-150} len={13 * shootFr} side={-1} fill={colors.leafNew} droop={0} tension={0} />
          <Leaf x={129} y={173 - 14 * shootFr} rot={-35} len={13 * shootFr} side={1} fill={colors.leafLight} droop={0} tension={0} />
        </G>
      )}

      {/* stem: ink outline, then colour; thinner toward the top */}
      <Path d={toPath(stemPoints.slice(0, split))} fill="none" stroke={colors.ink} strokeWidth={stemW + 2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={toPath(stemPoints.slice(split - 1))} fill="none" stroke={colors.ink} strokeWidth={stemW * 0.7 + 2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={toPath(stemPoints.slice(0, split))} fill="none" stroke={stemColor} strokeWidth={stemW} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={toPath(stemPoints.slice(split - 1))} fill="none" stroke={stemColor} strokeWidth={stemW * 0.7} strokeLinecap="round" strokeLinejoin="round" />

      {branches}
      {leaves}
      {crown}
    </Svg>
  );
}

function Swaying({ tension, children }: { tension: number; children: ReactNode }) {
  // Calm plants drift slowly; tense ones jitter faster and wider.
  const deg = useSway(7200 - tension * 4200, 1 + tension * 2.4);
  return <View style={{ transform: [{ rotate: `${deg}deg` }], transformOrigin: '50% 90%' }}>{children}</View>;
}

type PlantProps = {
  state: PlantState;
  /** Start from this state and animate to `state` (e.g. "before today's entry"). */
  from?: PlantState;
  /** ms before animating from `from` to `state`. */
  delay?: number;
  /** Idle sway, like a plant in a breeze. */
  sway?: boolean;
  /** Crop the viewBox to the plant itself (no empty margin), so it renders much larger at a given width. */
  tight?: boolean;
};

/** Botanical line drawing of a week's plant. Every value eases to its new state, so it grows and wilts visibly. */
export function Plant({ state, from, delay = 0, sway, tight }: PlantProps) {
  const growth = useTweenedNumber(state.growth, 1400, delay, from?.growth);
  const tension = useTweenedNumber(state.tension, 1400, delay, from?.tension);
  const droop = useTweenedNumber(state.droop, 1400, delay, from?.droop);
  const carry = useTweenedNumber(state.carry, 1400, delay, from?.carry);
  const drawing = <PlantDrawing growth={growth} tension={tension} droop={droop} carry={carry} tight={tight} />;
  return sway ? <Swaying tension={tension}>{drawing}</Swaying> : drawing;
}

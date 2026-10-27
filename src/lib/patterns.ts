import { averageScores } from './signals';
import { themeLabel, THEMES } from './themes';
import type { Entry, Signal } from './types';

export type ThemePattern = {
  theme: string;
  /** Days the theme appeared. */
  days: number;
  /** Average score on days with the theme minus the average on days without, per signal. */
  delta: Record<Signal, number>;
};

const SIGNAL_KEYS: Signal[] = ['depression', 'anxiety', 'meaning'];
/** Need this many days both with and without a theme before comparing. */
export const MIN_DAYS = 4;

/** True once any entry has been tagged. Untagged entries are indistinguishable from "no themes". */
export const hasThemes = (entries: Entry[]) => entries.some((e) => e.themes.length > 0);

export function themePatterns(entries: Entry[]): ThemePattern[] {
  const out: ThemePattern[] = [];
  for (const { key } of THEMES) {
    const withTheme = entries.filter((e) => e.themes.includes(key));
    const without = entries.filter((e) => !e.themes.includes(key));
    if (withTheme.length < MIN_DAYS || without.length < MIN_DAYS) continue;
    const a = averageScores(withTheme.map((e) => e.scores));
    const b = averageScores(without.map((e) => e.scores));
    out.push({
      theme: key,
      days: withTheme.length,
      delta: {
        depression: a.depression - b.depression,
        anxiety: a.anxiety - b.anxiety,
        meaning: a.meaning - b.meaning,
      },
    });
  }
  const size = (p: ThemePattern) => Math.max(...SIGNAL_KEYS.map((s) => Math.abs(p.delta[s])));
  return out.sort((x, y) => size(y) - size(x));
}

const BIG = 6;

/** Plain-language takeaways: the clearest theme for each signal, when the gap is big enough to mean something. */
export function headlines(patterns: ThemePattern[]): string[] {
  const lines: string[] = [];
  const top = (signal: Signal, dir: 1 | -1) =>
    patterns
      .filter((p) => p.delta[signal] * dir >= BIG)
      .sort((x, y) => y.delta[signal] * dir - x.delta[signal] * dir)[0];

  const anx = top('anxiety', 1);
  if (anx)
    lines.push(
      `Anxiety runs higher on days you write about ${themeLabel(anx.theme).toLowerCase()} (+${anx.delta.anxiety}).`,
    );
  const dep = top('depression', 1);
  if (dep) lines.push(`Low mood is higher on ${themeLabel(dep.theme).toLowerCase()} days (+${dep.delta.depression}).`);
  const meaning = top('meaning', 1);
  if (meaning)
    lines.push(
      `Meaning is highest when you write about ${themeLabel(meaning.theme).toLowerCase()} (+${meaning.delta.meaning}).`,
    );
  const lowMeaning = top('meaning', -1);
  if (lowMeaning)
    lines.push(`Meaning dips on ${themeLabel(lowMeaning.theme).toLowerCase()} days (${lowMeaning.delta.meaning}).`);
  return lines.slice(0, 3);
}

import { colors } from '@/theme/colors';
import type { Scores, Signal } from './types';

export const SIGNALS: { key: Signal; label: string; color: string }[] = [
  { key: 'depression', label: 'Depression', color: colors.depression },
  { key: 'anxiety', label: 'Anxiety', color: colors.anxiety },
  { key: 'meaning', label: 'Meaning', color: colors.meaning },
];

const WORDS: Record<Signal, [string, string, string]> = {
  depression: ['Low', 'Mild', 'High'],
  anxiety: ['Low', 'Mild', 'High'],
  meaning: ['Low', 'Moderate', 'Strong'],
};

/** Plain-language band for a 0-100 score. */
export function describe(signal: Signal, value: number): string {
  const band = value <= 25 ? 0 : value <= 50 ? 1 : 2;
  return WORDS[signal][band];
}

export function signalColor(signal: Signal): string {
  return SIGNALS.find((s) => s.key === signal)!.color;
}

export function averageScores(list: Scores[]): Scores {
  const avg = (key: Signal) => Math.round(list.reduce((sum, s) => sum + s[key], 0) / list.length);
  return { depression: avg('depression'), anxiety: avg('anxiety'), meaning: avg('meaning') };
}

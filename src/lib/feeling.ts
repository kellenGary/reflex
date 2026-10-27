import { wellbeing } from './plant';
import type { Scores } from './types';

export const FEELINGS = [
  { level: 1, label: 'Rough' },
  { level: 2, label: 'Low' },
  { level: 3, label: 'Okay' },
  { level: 4, label: 'Good' },
  { level: 5, label: 'Great' },
] as const;

export const feelingLabel = (level: number) => FEELINGS.find((f) => f.level === level)?.label ?? '';

/** Where the writing itself landed on the same five steps, from the three scores. */
export function readAsFeeling(scores: Scores): number {
  const w = wellbeing(scores);
  return w < 40 ? 1 : w < 52 ? 2 : w < 64 ? 3 : w < 76 ? 4 : 5;
}

/** A gentle sentence about how the person's own rating and the reading of their words compare. */
export function compareFeeling(felt: number, read: number): string {
  const diff = read - felt;
  if (diff === 0) return 'What you wrote matches how you said you felt.';
  if (Math.abs(diff) === 1) return 'Close. Your words and your feeling are within a step of each other.';
  return diff < 0
    ? 'Your words read heavier than you said you felt. That can be worth noticing.'
    : 'Your words read lighter than you said you felt.';
}

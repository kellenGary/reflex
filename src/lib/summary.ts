import { averageScores } from './signals';
import type { Entry } from './types';

/** Placeholder weekly recap built from the numbers. A model-written summary can replace this later. */
export function summarizeWeek(entries: Entry[]): string {
  if (entries.length === 0) return 'No entries yet.';
  const avg = averageScores(entries.map((e) => e.scores));
  const count = entries.length === 1 ? '1 entry' : `${entries.length} entries`;
  return `${count}. Meaning averaged ${avg.meaning}, anxiety ${avg.anxiety} and depression ${avg.depression}.`;
}

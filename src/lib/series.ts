import { addDays, weekStartKey } from './dates';
import { averageScores } from './signals';
import type { Entry, Signal } from './types';

export type Series = { values: Record<Signal, (number | null)[]>; keys: string[] };

const empty = (): Record<Signal, (number | null)[]> => ({ depression: [], anxiety: [], meaning: [] });

/** One point per day for `days` days ending at `endKey`. Days without an entry are null. */
export function dailySeries(entries: Entry[], endKey: string, days: number): Series {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const values = empty();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = addDays(endKey, -i);
    const entry = byDate.get(key);
    keys.push(key);
    values.depression.push(entry ? entry.scores.depression : null);
    values.anxiety.push(entry ? entry.scores.anxiety : null);
    values.meaning.push(entry ? entry.scores.meaning : null);
  }
  return { values, keys };
}

/** One point per week (average of that week's entries) for `weeks` weeks ending at the week of `endKey`. */
export function weeklySeries(entries: Entry[], endKey: string, weeks: number): Series {
  const values = empty();
  const keys: string[] = [];
  const endWeek = weekStartKey(endKey);
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(endWeek, -7 * i);
    const inWeek = entries.filter((e) => weekStartKey(e.date) === start);
    keys.push(start);
    const avg = inWeek.length ? averageScores(inWeek.map((e) => e.scores)) : null;
    values.depression.push(avg ? avg.depression : null);
    values.anxiety.push(avg ? avg.anxiety : null);
    values.meaning.push(avg ? avg.meaning : null);
  }
  return { values, keys };
}

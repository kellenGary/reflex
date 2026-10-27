import { addDays, weekStartKey } from './dates';
import { averageScores } from './signals';
import type { Entry, Scores } from './types';

/** What the plant needs to know, each 0-1. `vitality` is the single overall number (for labels). */
export type PlantState = {
  /** Height, leaf count and bloom. Driven mostly by overall wellbeing and meaning. */
  growth: number;
  /** Anxiety: tight, narrow, upright leaves, a kinked stem, a jittery sway. */
  tension: number;
  /** Depression: drooping leaves, yellowing and browning, a bowed stem, dropped leaves. */
  droop: number;
  /** Last week's result: stem sturdiness, soil richness, a new shoot at the base. */
  carry: number;
  vitality: number;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** 0-100 wellbeing from one set of scores: meaning up is good, anxiety and depression down are good. */
export const wellbeing = (s: Scores) => (s.meaning + (100 - s.anxiety) + (100 - s.depression)) / 3;

// Typical scores land in the 40s-70s, so stretch that band across the plant's full range.
const WORST = 35;
const BEST = 80;

/**
 * The week's plant. Its score is four equal quarters: the week-so-far average of meaning, of low
 * anxiety and of low depression, plus last week's overall wellbeing. If there was no last week, this
 * week's own wellbeing stands in for the last quarter. `excludeDate` leaves one day out (to see the
 * plant as it was before an entry).
 */
export function plantStateForWeek(all: Entry[], weekStart: string, excludeDate?: string): PlantState {
  const inWeek = (start: string) => all.filter((e) => weekStartKey(e.date) === start && e.date !== excludeDate);
  const now = inWeek(weekStart);
  const prev = inWeek(addDays(weekStart, -7));
  const prevScore = prev.length ? wellbeing(averageScores(prev.map((e) => e.scores))) : null;

  if (now.length === 0) {
    const carryScore = prevScore ?? 0;
    return { growth: 0, tension: 0, droop: 0, carry: clamp01((carryScore - WORST) / (BEST - WORST)), vitality: 0 };
  }

  const avg = averageScores(now.map((e) => e.scores));
  const carryScore = prevScore ?? wellbeing(avg);
  const total = 0.25 * avg.meaning + 0.25 * (100 - avg.anxiety) + 0.25 * (100 - avg.depression) + 0.25 * carryScore;
  const vitality = clamp01((total - WORST) / (BEST - WORST));

  return {
    vitality,
    growth: clamp01(0.6 * vitality + 0.4 * clamp01((avg.meaning - 30) / 60)),
    tension: clamp01((avg.anxiety - 25) / 50),
    droop: clamp01((avg.depression - 15) / 45),
    carry: clamp01((carryScore - WORST) / (BEST - WORST)),
  };
}

export function vitalityLabel(v: number): string {
  return v < 0.34 ? 'Wilting' : v < 0.67 ? 'Growing' : 'Thriving';
}

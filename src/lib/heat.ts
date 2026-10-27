import { mix } from './color';
import { wellbeing } from './plant';
import { signalColor } from './signals';
import type { Scores, Signal } from './types';

export type Metric = 'overall' | Signal;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Overall mood runs from a warm clay (a harder day) through soft yellow to green (an easier one).
const HARD = '#C4967A';
const MIDDLE = '#E9DBA4';
const EASY = '#6F9449';

const overall = (t: number) => (t < 0.5 ? mix(HARD, MIDDLE, t * 2) : mix(MIDDLE, EASY, (t - 0.5) * 2));

/** Color for one day in the year view. `track` is the page's quiet fill, so low values fade into it. */
export function heatColor(metric: Metric, scores: Scores, track: string): string {
  if (metric === 'overall') return overall(clamp01((wellbeing(scores) - 30) / 50));
  return mix(track, signalColor(metric), 0.2 + 0.8 * clamp01(scores[metric] / 85));
}

/** Five swatches for the legend, lowest to highest. */
export function heatRamp(metric: Metric, track: string): string[] {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  return metric === 'overall' ? steps.map(overall) : steps.map((t) => mix(track, signalColor(metric), 0.2 + 0.8 * t));
}

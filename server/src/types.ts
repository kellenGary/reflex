import { z } from 'zod';

export const signalSchema = z.enum(['depression', 'anxiety', 'meaning']);
export type Signal = z.infer<typeof signalSchema>;

export type Scores = Record<Signal, number>;
export type Highlight = { text: string; signal: Signal };
export type Classification = { scores: Scores; highlights: Highlight[] };

/** Same shape as the app's `Entry` (src/lib/types.ts). */
export type Entry = { date: string; text: string; scores: Scores; highlights: Highlight[] };

import { z } from 'zod';

export const signalSchema = z.enum(['depression', 'anxiety', 'meaning']);
export type Signal = z.infer<typeof signalSchema>;

export type Scores = Record<Signal, number>;
export type Highlight = { text: string; signal: Signal };
export type Tags = { themes: string[]; crisis: boolean };
/** What the writer chose before writing: 1 (rough) to 5 (great), or null if they skipped it. */
export type Feeling = number | null;
export type Meta = Tags & { feeling: Feeling };
export type Classification = { scores: Scores; highlights: Highlight[] } & Tags;

/** Same shape as the app's `Entry` (src/lib/types.ts). */
export type Entry = { date: string; text: string; scores: Scores; highlights: Highlight[] } & Tags & { feeling: Feeling };

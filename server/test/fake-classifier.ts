import type { Classify } from '../src/services/jev';
import type { Highlight, Signal } from '../src/types';

/** Deterministic keyword scorer for tests, so the API tests don't call Jev. */
const KEYWORDS: Record<Signal, string[]> = {
  depression: ['tired', 'empty', 'numb', 'alone', 'hopeless', 'sad', 'heavy', 'pointless'],
  anxiety: ['worry', 'worried', 'deadline', 'anxious', 'stress', 'nervous', 'overwhelmed', 'tense', "couldn't settle"],
  meaning: ['grateful', 'hike', 'friend', 'love', 'proud', 'purpose', 'cleared', 'listened', 'cooked', 'lighter'],
};
const BASE: Record<Signal, number> = { depression: 18, anxiety: 32, meaning: 50 };

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 9973;
  return h;
}

export const fakeClassify: Classify = async (text) => {
  const lower = text.toLowerCase();
  const highlights: Highlight[] = [];
  const scores = { depression: 0, anxiety: 0, meaning: 0 };
  (Object.keys(KEYWORDS) as Signal[]).forEach((signal, i) => {
    const hits = KEYWORDS[signal].filter((word) => lower.includes(word));
    for (const word of hits) {
      const at = lower.indexOf(word);
      highlights.push({ text: text.slice(at, at + word.length), signal });
    }
    const jitter = (hash(text + signal) % 11) - 5;
    scores[signal] = Math.max(2, Math.min(98, BASE[signal] + hits.length * 9 + jitter + i));
  });
  return { scores, highlights };
};

import { noul, score, type Questions } from '@typesafe-ai/sdk';

import type { Classification, Highlight, Signal, Tags } from '../types';

export type Classify = (text: string) => Promise<Classification>;
/** Themes and the crisis check only, so older entries can be tagged without changing their scores. */
export type Tag = (text: string) => Promise<Tags>;

/** Sends one request to Jev and returns its answers by question name. */
export type JevAsk = (state: string, questions: Questions) => Promise<Record<string, unknown>>;

/*
 * How an entry becomes scores and highlights (one Jev request per entry):
 *  - Three Score questions rate the whole entry on a 5-level rubric. The expected level (0-4, can fall between
 *    levels) is stretched to 0-100.
 *  - Jev can't point at a phrase, so highlights come from asking, for every sentence, one Noul per signal ("does
 *    this sentence express X?"). Sentences that clear HIGHLIGHT_MIN are kept, each under the signal it fits best.
 * Levels describe what the writer *expresses*. This is not a clinical assessment.
 */

const LEVELS: Record<Signal, { question: string; levels: string[] }> = {
  depression: {
    question: 'How much low mood does the writer express in this journal entry?',
    levels: [
      'No low mood. The writer sounds content, engaged, or neutral.',
      'Mild: a tired, flat, or disappointed moment, but still engaged with the day.',
      'Moderate: clear sadness, low motivation, or withdrawal that colours much of the entry.',
      'Marked: persistent hopelessness, emptiness, worthlessness, or loss of interest in things.',
      'Severe: overwhelming despair, feeling life is pointless, or harsh self-condemnation throughout.',
    ],
  },
  anxiety: {
    question: 'How much anxiety, worry, or tension does the writer express in this journal entry?',
    levels: [
      'Calm. No worry or tension is expressed.',
      'Mild: a passing worry or small unease about something specific.',
      'Moderate: noticeable worry, restlessness, or tension about one or more things.',
      'Marked: pervasive worry, racing thoughts, or difficulty settling or relaxing.',
      'Severe: overwhelming dread or panic, or being unable to function because of fear.',
    ],
  },
  meaning: {
    question: 'How much sense of meaning or purpose does the writer express in this journal entry?',
    levels: [
      'None. Everything feels empty, pointless, or disconnected.',
      'Little: going through the motions with scarcely a sense of why it matters.',
      'Some: occasional moments of purpose, connection, or gratitude, mixed with flatter stretches.',
      'Clear: a real sense of purpose, connection to others, or gratitude for what they are doing.',
      'Deep: strong fulfilment, connection to people or values, and a sense that their life matters.',
    ],
  },
};

const SENTENCE_TASK: Record<Signal, string> = {
  depression:
    'In this sentence, the writer expresses low mood, hopelessness, emptiness, worthlessness, or loss of interest.',
  anxiety: 'In this sentence, the writer expresses worry, fear, tension, or restlessness.',
  meaning: 'In this sentence, the writer expresses purpose, gratitude, connection, or something that matters to them.',
};

const SIGNALS = Object.keys(LEVELS) as Signal[];

/** What an entry is about. Each is a yes/no question, so an entry can carry several themes. Keep keys stable. */
export const THEMES = [
  { key: 'work', about: 'work, study, a job, deadlines, or colleagues' },
  { key: 'sleep', about: 'sleep, tiredness, insomnia, or rest at night' },
  { key: 'family', about: 'family members such as parents, siblings, or children' },
  { key: 'friends', about: 'friends or socialising' },
  { key: 'relationship', about: 'a romantic partner or dating' },
  { key: 'health', about: 'physical health, illness, pain, food, or the body' },
  { key: 'money', about: 'money, bills, spending, or financial worry' },
  { key: 'creative', about: 'creative projects, hobbies, or making things' },
  { key: 'outdoors', about: 'being outdoors, nature, exercise, or movement' },
] as const;

const THEME_MIN = 0.6;
/** Low on purpose: a missed crisis is far worse than a gentle message shown by mistake. */
const CRISIS_MIN = 0.4;
const CRISIS_QUESTIONS = {
  crisis_end_life: 'The writer expresses thoughts of suicide, of wanting to die, or of ending their own life.',
  crisis_self_harm: 'The writer expresses thoughts of deliberately hurting themselves.',
} as const;

function tagQuestions(): Questions {
  const q: Questions = {};
  for (const t of THEMES) q[`theme_${t.key}`] = noul(`The writer talks about ${t.about}.`);
  for (const [name, text] of Object.entries(CRISIS_QUESTIONS)) q[name] = noul(text);
  return q;
}

function readTags(answers: Record<string, unknown>): Tags {
  // A missing crisis answer throws (see num): we never treat "no answer" as "no risk".
  const crisis = Object.keys(CRISIS_QUESTIONS).some((name) => num(answers[name], 'noul') >= CRISIS_MIN);
  const themes = THEMES.filter((t) => num(answers[`theme_${t.key}`], 'noul') >= THEME_MIN).map((t) => t.key);
  return { themes, crisis };
}
const HIGHLIGHT_MIN = 0.7;
const MAX_HIGHLIGHTS_PER_SIGNAL = 3;
const MAX_SENTENCES = 40;
const MIN_SENTENCE = 12;
const MAX_SENTENCE = 300;

/** Sentences exactly as written (so they can be found in the text again), capped to bound cost. */
export function splitSentences(text: string): string[] {
  const chunks = text.match(/[^.!?\n]+[.!?]*/g) ?? [];
  return chunks
    .map((c) => c.trim())
    .filter((c) => c.length >= MIN_SENTENCE && c.length <= MAX_SENTENCE)
    .slice(0, MAX_SENTENCES);
}

const num = (answer: unknown, field: 'score' | 'noul'): number => {
  const v = (answer as Record<string, unknown> | undefined)?.[field];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`Jev answer is missing "${field}"`);
  return v;
};

export function createJevTagger(ask: JevAsk): Tag {
  return async (text) => readTags(await ask(text, tagQuestions()));
}

export function createJevClassifier(ask: JevAsk): Classify {
  return async (text) => {
    const sentences = splitSentences(text);

    const questions: Questions = tagQuestions();
    for (const s of SIGNALS) questions[`level_${s}`] = score(LEVELS[s].question, LEVELS[s].levels);
    sentences.forEach((sentence, i) => {
      for (const s of SIGNALS) questions[`s${i}_${s}`] = noul({ task: SENTENCE_TASK[s], sentence });
    });

    const answers = await ask(text, questions);

    const scores = { depression: 0, anxiety: 0, meaning: 0 };
    for (const s of SIGNALS) {
      const top = LEVELS[s].levels.length - 1;
      scores[s] = Math.max(0, Math.min(100, Math.round((num(answers[`level_${s}`], 'score') / top) * 100)));
    }

    // Each sentence is highlighted for the signal it fits best; keep the strongest few per signal.
    const perSignal: Record<Signal, { text: string; p: number }[]> = { depression: [], anxiety: [], meaning: [] };
    sentences.forEach((sentence, i) => {
      const best = SIGNALS.map((s) => ({ s, p: num(answers[`s${i}_${s}`], 'noul') })).sort((a, b) => b.p - a.p)[0];
      if (best.p >= HIGHLIGHT_MIN) perSignal[best.s].push({ text: sentence, p: best.p });
    });
    const highlights: Highlight[] = SIGNALS.flatMap((s) =>
      perSignal[s]
        .sort((a, b) => b.p - a.p)
        .slice(0, MAX_HIGHLIGHTS_PER_SIGNAL)
        .map((h) => ({ text: h.text, signal: s })),
    );

    return { scores, highlights, ...readTags(answers) };
  };
}

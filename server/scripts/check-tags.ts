/*
 * Tries the theme + crisis questions on made-up entries with the real model, so you can judge them before relying on them.
 *   npx tsx --env-file=.env scripts/check-tags.ts
 * Sends only the sample text below to TypeSafe. Nothing is read from or written to the database.
 */
import { TypeSafeClient, type Questions } from '@typesafe-ai/sdk';

import { createJevTagger } from '../src/services/jev';

const jev = new TypeSafeClient({ apiKey: process.env.JEV_API_KEY, timeout: 30_000 });
const tag = createJevTagger(async (state, questions: Questions) => (await jev.systemOne({ state, questions })).answers);

const samples: [string, string][] = [
  ['work + sleep', 'Barely slept last night and the deadline at work is looming. My manager scheduled another meeting for tomorrow.'],
  ['friends + outdoors', 'Went for a long hike with two friends and we laughed the whole way down. Felt really alive.'],
  ['family + money', 'Called my mum about the rent. She offered to help but I hate asking. The bills keep piling up.'],
  ['ordinary', 'Cloudy day. Thought about nothing in particular and watched the rain for a while.'],
  ['should flag (plain)', 'I have been thinking everyone would be better off without me. Some nights I think about ending my life.'],
  ['should flag (indirect)', "I just don't want to be here anymore. I keep wondering what it would take to not wake up."],
  ['should NOT flag (idiom)', 'That meeting nearly killed me, I was dying of boredom. I could have died laughing at his joke though.'],
  ['should NOT flag (low mood)', 'Felt flat and tired all day. Nothing sounded fun, so I stayed in and watched TV.'],
];

for (const [name, text] of samples) console.log(name.padEnd(28), JSON.stringify(await tag(text)));

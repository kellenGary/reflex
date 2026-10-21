import { describe, expect, it } from 'vitest';

import { createJevClassifier, splitSentences } from '../src/services/jev';

describe('splitSentences', () => {
  it('returns sentences verbatim, so they can be found in the text again', () => {
    const text = 'Ok. I finally cleared the desk and it felt great!\n\nWalked to the market with no podcast on.';
    const sentences = splitSentences(text);
    expect(sentences).toEqual([
      'I finally cleared the desk and it felt great!',
      'Walked to the market with no podcast on.',
    ]);
    for (const s of sentences) expect(text).toContain(s);
  });

  it('drops fragments, drops very long run-ons, and caps the count', () => {
    expect(splitSentences('Ok. Yes. No.')).toEqual([]);
    expect(splitSentences('x'.repeat(400) + '.')).toEqual([]);
    const many = Array.from({ length: 80 }, (_, i) => `This is sentence number ${i} of the entry.`).join(' ');
    expect(splitSentences(many)).toHaveLength(40);
  });
});

describe('createJevClassifier', () => {
  const text = 'I cleared the desk and felt lighter. I kept worrying about Thursday. Nothing else happened at all.';

  it('asks one request with three rubric scores plus a noul per sentence and signal', async () => {
    let asked: Record<string, unknown> = {};
    const classify = createJevClassifier(async (_state, questions) => {
      asked = questions;
      return {};
    });
    await classify(text).catch(() => {}); // empty answers throw; we only inspect the request
    expect(Object.keys(asked).sort()).toEqual(
      [
        'level_depression',
        'level_anxiety',
        'level_meaning',
        ...[0, 1, 2].flatMap((i) => ['depression', 'anxiety', 'meaning'].map((s) => `s${i}_${s}`)),
      ].sort(),
    );
  });

  it('stretches 0-4 levels to 0-100 and keeps strong sentences under their best signal', async () => {
    const classify = createJevClassifier(async () => ({
      level_depression: { type: 'score', score: 0.4 },
      level_anxiety: { type: 'score', score: 2.0 },
      level_meaning: { type: 'score', score: 3.6 },
      s0_depression: { noul: 0.05 }, s0_anxiety: { noul: 0.1 }, s0_meaning: { noul: 0.92 },
      s1_depression: { noul: 0.1 }, s1_anxiety: { noul: 0.88 }, s1_meaning: { noul: 0.05 },
      s2_depression: { noul: 0.3 }, s2_anxiety: { noul: 0.2 }, s2_meaning: { noul: 0.1 }, // below the bar
    }));
    const result = await classify(text);
    expect(result.scores).toEqual({ depression: 10, anxiety: 50, meaning: 90 });
    expect(result.highlights).toEqual(
      expect.arrayContaining([
        { text: 'I cleared the desk and felt lighter.', signal: 'meaning' },
        { text: 'I kept worrying about Thursday.', signal: 'anxiety' },
      ]),
    );
    expect(result.highlights).toHaveLength(2);
  });

  it('keeps at most 3 highlights per signal, strongest first', async () => {
    const sentences = Array.from({ length: 5 }, (_, i) => `Happy sentence number ${i} is here.`);
    const answers: Record<string, unknown> = {
      level_depression: { score: 0 }, level_anxiety: { score: 0 }, level_meaning: { score: 4 },
    };
    sentences.forEach((_, i) => {
      answers[`s${i}_depression`] = { noul: 0 };
      answers[`s${i}_anxiety`] = { noul: 0 };
      answers[`s${i}_meaning`] = { noul: 0.75 + i * 0.04 };
    });
    const result = await createJevClassifier(async () => answers)(sentences.join(' '));
    expect(result.highlights.map((h) => h.text)).toEqual(sentences.slice(2).reverse());
  });

  it('throws if Jev returns an unusable answer, so nothing gets saved with made-up scores', async () => {
    const classify = createJevClassifier(async () => ({ level_depression: {} }));
    await expect(classify(text)).rejects.toThrow();
  });
});

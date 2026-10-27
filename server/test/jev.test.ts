import { describe, expect, it } from 'vitest';

import { createJevClassifier, splitSentences } from '../src/services/jev';

describe('crisis check', () => {
  it('flags at a low threshold from either question, and never treats a missing answer as safe', async () => {
    const base = { level_depression: { score: 0 }, level_anxiety: { score: 0 }, level_meaning: { score: 2 } };
    const text = 'A quiet day with nothing to report here.';
    const flagged = (over: Record<string, number>) =>
      createJevClassifier(async () => ({ ...base, ...tagAnswers(over), s0_depression: { noul: 0 }, s0_anxiety: { noul: 0 }, s0_meaning: { noul: 0 } }))(text);
    expect((await flagged({ crisis_end_life: 0.45 })).crisis).toBe(true);
    expect((await flagged({ crisis_self_harm: 0.41 })).crisis).toBe(true);
    expect((await flagged({ crisis_end_life: 0.2 })).crisis).toBe(false);

    const { crisis_end_life: _omit, ...missing } = tagAnswers();
    await expect(
      createJevClassifier(async () => ({ ...base, ...missing, s0_depression: { noul: 0 }, s0_anxiety: { noul: 0 }, s0_meaning: { noul: 0 } }))(text),
    ).rejects.toThrow();
  });
});

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

const tagAnswers = (over: Record<string, number> = {}) => ({
  ...Object.fromEntries(
    ['work', 'sleep', 'family', 'friends', 'relationship', 'health', 'money', 'creative', 'outdoors'].map((t) => [
      `theme_${t}`,
      { noul: over[`theme_${t}`] ?? 0.05 },
    ]),
  ),
  crisis_end_life: { noul: over.crisis_end_life ?? 0.01 },
  crisis_self_harm: { noul: over.crisis_self_harm ?? 0.01 },
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
        ...Object.keys(tagAnswers()),
        'level_depression',
        'level_anxiety',
        'level_meaning',
        ...[0, 1, 2].flatMap((i) => ['depression', 'anxiety', 'meaning'].map((s) => `s${i}_${s}`)),
      ].sort(),
    );
  });

  it('stretches 0-4 levels to 0-100 and keeps strong sentences under their best signal', async () => {
    const classify = createJevClassifier(async () => ({
      ...tagAnswers({ theme_outdoors: 0.9, theme_work: 0.65 }),
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
    expect(result.themes).toEqual(['work', 'outdoors']);
    expect(result.crisis).toBe(false);
  });

  it('keeps at most 3 highlights per signal, strongest first', async () => {
    const sentences = Array.from({ length: 5 }, (_, i) => `Happy sentence number ${i} is here.`);
    const answers: Record<string, unknown> = {
      ...tagAnswers(),
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

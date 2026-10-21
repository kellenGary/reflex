export type Signal = 'depression' | 'anxiety' | 'meaning';

export type Scores = Record<Signal, number>;

/** A phrase in the entry text that contributed to a signal. */
export type Highlight = { text: string; signal: Signal };

export type Entry = {
  /** Local calendar day, YYYY-MM-DD. One entry per day. */
  date: string;
  text: string;
  scores: Scores;
  highlights: Highlight[];
};

export type Classification = Pick<Entry, 'scores' | 'highlights'>;

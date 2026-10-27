import { decrypt, encrypt } from './crypto';
import type { EntryRow } from './db/schema';
import type { Entry, Feeling, Highlight, Meta, Tags } from './types';

const aad = (userId: string, date: string) => `${userId}:${date}`;

export function sealMeta(userId: string, date: string, meta: Meta, key: Buffer): string {
  return encrypt(JSON.stringify(meta), key, aad(userId, date));
}

export function openMeta(row: EntryRow, key: Buffer): Meta {
  if (!row.metaEnc) return { themes: [], crisis: false, feeling: null };
  const meta = JSON.parse(decrypt(row.metaEnc, key, aad(row.userId, row.entryDate))) as Partial<Meta>;
  return { themes: meta.themes ?? [], crisis: meta.crisis ?? false, feeling: meta.feeling ?? null };
}

export function sealEntry(
  userId: string,
  date: string,
  text: string,
  highlights: Highlight[],
  tags: Tags,
  feeling: Feeling,
  key: Buffer,
) {
  return {
    textEnc: encrypt(text, key, aad(userId, date)),
    highlightsEnc: encrypt(JSON.stringify(highlights), key, aad(userId, date)),
    metaEnc: sealMeta(userId, date, { ...tags, feeling }, key),
  };
}

export function openEntry(row: EntryRow, key: Buffer): Entry {
  const a = aad(row.userId, row.entryDate);
  const meta = openMeta(row, key);
  return {
    date: row.entryDate,
    text: decrypt(row.textEnc, key, a),
    highlights: JSON.parse(decrypt(row.highlightsEnc, key, a)) as Highlight[],
    scores: { depression: row.depression, anxiety: row.anxiety, meaning: row.meaning },
    themes: meta.themes,
    crisis: meta.crisis,
    feeling: meta.feeling,
  };
}

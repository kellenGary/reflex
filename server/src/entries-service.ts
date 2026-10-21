import { decrypt, encrypt } from './crypto';
import type { EntryRow } from './db/schema';
import type { Entry, Highlight } from './types';

const aad = (userId: string, date: string) => `${userId}:${date}`;

export function sealEntry(userId: string, date: string, text: string, highlights: Highlight[], key: Buffer) {
  return {
    textEnc: encrypt(text, key, aad(userId, date)),
    highlightsEnc: encrypt(JSON.stringify(highlights), key, aad(userId, date)),
  };
}

export function openEntry(row: EntryRow, key: Buffer): Entry {
  const a = aad(row.userId, row.entryDate);
  return {
    date: row.entryDate,
    text: decrypt(row.textEnc, key, a),
    highlights: JSON.parse(decrypt(row.highlightsEnc, key, a)) as Highlight[],
    scores: { depression: row.depression, anxiety: row.anxiety, meaning: row.meaning },
  };
}

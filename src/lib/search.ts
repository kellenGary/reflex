import type { Entry } from './types';

export const MIN_QUERY = 2;

export const isSearching = (query: string) => query.trim().length >= MIN_QUERY;

/** Entries whose text contains the query (ignoring case), in the order given. */
export function searchEntries(entries: Entry[], query: string): Entry[] {
  const q = query.trim().toLowerCase();
  return q.length < MIN_QUERY ? [] : entries.filter((e) => e.text.toLowerCase().includes(q));
}

/** A short passage around the first match, with ellipses where it was cut. */
export function snippet(text: string, query: string, radius = 80): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const at = flat.toLowerCase().indexOf(query.trim().toLowerCase());
  if (at < 0) return flat.slice(0, radius * 2);
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + query.trim().length + radius);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`;
}

/** Splits `text` into pieces, marking the ones that match the query. */
export function splitMatches(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim();
  if (q.length < MIN_QUERY) return [{ text, match: false }];
  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(needle, from); at >= 0; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + needle.length), match: true });
    from = at + needle.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
}

import type { Entry } from '@/lib/types';
import { supabase } from './supabase';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');

/** `network`: couldn't reach the server. `auth`: our login was rejected. `server`: anything else. */
export class ApiError extends Error {
  constructor(
    public kind: 'network' | 'auth' | 'server',
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new ApiError('network', `Could not reach the server at ${BASE}`);
  }
  if (!res.ok) throw new ApiError(res.status === 401 ? 'auth' : 'server', `Request failed (${res.status})`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/**
 * Fills in anything an older server doesn't send yet. The app and the server are released separately (and a phone can
 * keep an old app for weeks), so each must cope with the other being a version behind.
 */
function normalize(e: Partial<Entry> & Pick<Entry, 'date' | 'text' | 'scores'>): Entry {
  return {
    ...e,
    highlights: e.highlights ?? [],
    themes: e.themes ?? [],
    crisis: e.crisis ?? false,
    feeling: e.feeling ?? null,
  };
}

export const api = {
  listEntries: () => request<{ entries: Entry[] }>('/v1/entries').then((r) => r.entries.map(normalize)),
  /** Creates or edits the entry for `date`. The server scores the text. */
  /** `feeling` (1-5, or null to clear) is only sent when given; leaving it out keeps what was chosen before. */
  saveEntry: (date: string, text: string, feeling?: number | null) =>
    request<Entry>(`/v1/entries/${date}`, { method: 'PUT', body: JSON.stringify({ text, feeling }) }).then(normalize),
  deleteEntry: (date: string) => request<void>(`/v1/entries/${date}`, { method: 'DELETE' }),
  /** Tags older entries with themes. Call again while `more` is true. */
  refreshInsights: () =>
    request<{ updated: number; failed: number; more: boolean }>('/v1/refresh-insights', { method: 'POST' }),
  exportData: () =>
    request<{ exportedAt: string; entries: Entry[] }>('/v1/export').then((r) => ({
      ...r,
      entries: r.entries.map(normalize),
    })),
  /** Deletes every entry and the login itself. */
  deleteAccount: () => request<void>('/v1/me', { method: 'DELETE' }),
};

/** Friendly text for a failed save. The user's writing is never discarded on failure. */
export function saveErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.kind === 'network')
    return "We can't reach the server right now. Your text is still here, so try again in a moment.";
  return "We couldn't score your entry right now. Your text is still here, so try again in a moment.";
}

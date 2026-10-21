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

export const api = {
  listEntries: () => request<{ entries: Entry[] }>('/v1/entries').then((r) => r.entries),
  /** Creates or edits the entry for `date`. The server scores the text. */
  saveEntry: (date: string, text: string) =>
    request<Entry>(`/v1/entries/${date}`, { method: 'PUT', body: JSON.stringify({ text }) }),
  deleteEntry: (date: string) => request<void>(`/v1/entries/${date}`, { method: 'DELETE' }),
  exportData: () => request<{ exportedAt: string; entries: Entry[] }>('/v1/export'),
  /** Deletes every entry and the login itself. */
  deleteAccount: () => request<void>('/v1/me', { method: 'DELETE' }),
};

/** Friendly text for a failed save. The user's writing is never discarded on failure. */
export function saveErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.kind === 'network')
    return "We can't reach the server right now. Your text is still here, so try again in a moment.";
  return "We couldn't score your entry right now. Your text is still here, so try again in a moment.";
}

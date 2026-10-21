import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { addDays, todayKey } from '@/lib/dates';
import type { Entry } from '@/lib/types';
import { api, ApiError } from '@/services/api';
import { useAuth } from './auth';

type Status = 'loading' | 'ready' | 'error';
type ErrorKind = ApiError['kind'];

type EntriesContextValue = {
  status: Status;
  /** Why loading failed, when `status` is 'error'. */
  errorKind: ErrorKind | null;
  reload: () => void;
  /** Newest first. */
  entries: Entry[];
  today: string;
  /** Consecutive days written, ending today (or yesterday if today isn't written yet). */
  streak: number;
  getEntry: (date: string) => Entry | undefined;
  /** Saves today's entry. The server scores it. */
  addEntry: (text: string) => Promise<Entry>;
  /** Edits an entry and re-scores it. */
  updateEntry: (date: string, text: string) => Promise<Entry>;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

const newestFirst = (a: Entry, b: Entry) => (a.date < b.date ? 1 : -1);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [attempt, setAttempt] = useState(0);
  // Results are tagged with the user and attempt they were loaded for, so a different user (or a retry)
  // never sees stale data and nothing needs resetting when someone signs out.
  const loadKey = userId ? `${userId}:${attempt}` : null;
  const [result, setResult] = useState<{ key: string; entries: Entry[]; error: ErrorKind | null } | null>(null);
  const today = todayKey();

  useEffect(() => {
    if (!loadKey) return;
    let cancelled = false;
    api
      .listEntries()
      .then((list) => !cancelled && setResult({ key: loadKey, entries: [...list].sort(newestFirst), error: null }))
      .catch(
        (e) => !cancelled && setResult({ key: loadKey, entries: [], error: e instanceof ApiError ? e.kind : 'server' }),
      );
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  const current = result && result.key === loadKey ? result : null;
  const entries = useMemo(() => current?.entries ?? [], [current]);
  const status: Status = !current ? 'loading' : current.error ? 'error' : 'ready';
  const errorKind = current?.error ?? null;

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const getEntry = useCallback((date: string) => entries.find((e) => e.date === date), [entries]);

  const save = useCallback(
    async (date: string, text: string): Promise<Entry> => {
      const entry = await api.saveEntry(date, text);
      setResult((prev) =>
        prev && prev.key === loadKey
          ? { ...prev, entries: [entry, ...prev.entries.filter((e) => e.date !== date)].sort(newestFirst) }
          : prev,
      );
      return entry;
    },
    [loadKey],
  );

  const addEntry = useCallback((text: string) => save(today, text), [save, today]);
  const updateEntry = useCallback((date: string, text: string) => save(date, text), [save]);

  const streak = useMemo(() => {
    const dates = new Set(entries.map((e) => e.date));
    let cursor = dates.has(today) ? today : addDays(today, -1);
    let count = 0;
    while (dates.has(cursor)) {
      count++;
      cursor = addDays(cursor, -1);
    }
    return count;
  }, [entries, today]);

  const value = useMemo(
    () => ({ status, errorKind, reload, entries, today, streak, getEntry, addEntry, updateEntry }),
    [status, errorKind, reload, entries, today, streak, getEntry, addEntry, updateEntry],
  );

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries(): EntriesContextValue {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used inside <EntriesProvider>');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { readPref, writePref } from '@/lib/prefs';
import { useAuth } from '@/state/auth';

// Bump when what is sent to the model changes, so everyone is asked again.
const VERSION = 1;
const keyFor = (userId: string) => `lilac.consent.v${VERSION}.${userId}`;

type ConsentValue = {
  /** False until the stored answer has been read. */
  ready: boolean;
  accepted: boolean;
  accept: () => Promise<void>;
};

const ConsentContext = createContext<ConsentValue | null>(null);

/** Whether this person has agreed to their entries being read by the scoring model. Remembered per account, per device. */
export function ConsentProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  // The stored answer, tagged with the account it was read for so a stale one is never used after switching accounts.
  const [stored, setStored] = useState<{ userId: string; accepted: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    readPref(keyFor(userId)).then((v) => live && setStored({ userId, accepted: v === 'yes' }));
    return () => {
      live = false;
    };
  }, [userId]);

  const accept = useCallback(async () => {
    if (!userId) return;
    await writePref(keyFor(userId), 'yes');
    setStored({ userId, accepted: true });
  }, [userId]);

  const ready = !userId || stored?.userId === userId;
  const accepted = !!userId && stored?.userId === userId && stored.accepted;
  const value = useMemo(() => ({ ready, accepted, accept }), [ready, accepted, accept]);
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used inside ConsentProvider');
  return ctx;
}

import { and, asc, eq, gte, isNull, lte } from 'drizzle-orm';

import type { Db } from './client';
import { entries, type EntryRow } from './schema';

export type EntryWrite = {
  userId: string;
  entryDate: string;
  textEnc: string;
  highlightsEnc: string;
  metaEnc: string;
  scores: { depression: number; anxiety: number; meaning: number };
};

export async function listEntries(db: Db, userId: string, range: { from?: string; to?: string } = {}): Promise<EntryRow[]> {
  const conditions = [eq(entries.userId, userId)];
  if (range.from) conditions.push(gte(entries.entryDate, range.from));
  if (range.to) conditions.push(lte(entries.entryDate, range.to));
  return db.select().from(entries).where(and(...conditions)).orderBy(asc(entries.entryDate));
}

export async function getEntry(db: Db, userId: string, entryDate: string): Promise<EntryRow | undefined> {
  const [row] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, userId), eq(entries.entryDate, entryDate)))
    .limit(1);
  return row;
}

export async function upsertEntry(db: Db, w: EntryWrite): Promise<EntryRow> {
  const values = {
    userId: w.userId,
    entryDate: w.entryDate,
    textEnc: w.textEnc,
    highlightsEnc: w.highlightsEnc,
    metaEnc: w.metaEnc,
    depression: w.scores.depression,
    anxiety: w.scores.anxiety,
    meaning: w.scores.meaning,
  };
  const [row] = await db
    .insert(entries)
    .values(values)
    .onConflictDoUpdate({
      target: [entries.userId, entries.entryDate],
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function deleteEntry(db: Db, userId: string, entryDate: string): Promise<boolean> {
  const rows = await db
    .delete(entries)
    .where(and(eq(entries.userId, userId), eq(entries.entryDate, entryDate)))
    .returning({ id: entries.id });
  return rows.length > 0;
}

export async function deleteAllEntries(db: Db, userId: string): Promise<number> {
  const rows = await db.delete(entries).where(eq(entries.userId, userId)).returning({ id: entries.id });
  return rows.length;
}

export async function listEntriesMissingMeta(db: Db, userId: string, limit: number): Promise<EntryRow[]> {
  return db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, userId), isNull(entries.metaEnc)))
    .orderBy(asc(entries.entryDate))
    .limit(limit);
}

export async function setMeta(db: Db, userId: string, entryDate: string, metaEnc: string): Promise<void> {
  await db
    .update(entries)
    .set({ metaEnc })
    .where(and(eq(entries.userId, userId), eq(entries.entryDate, entryDate)));
}

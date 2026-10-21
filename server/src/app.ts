import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import type { DeleteAuthUser, VerifyToken } from './auth';
import type { Db } from './db/client';
import { deleteAllEntries, deleteEntry, getEntry, listEntries, upsertEntry } from './db/entries-repo';
import { openEntry, sealEntry } from './entries-service';
import type { Classify } from './services/jev';

export type AppDeps = {
  db: Db;
  /** 32-byte AES key for entry text. */
  key: Buffer;
  verifyToken: VerifyToken;
  deleteAuthUser: DeleteAuthUser;
  classify: Classify;
  corsOrigins: string[];
  now?: () => Date;
};

type Vars = { Variables: { userId: string } };

const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
  }, 'not a real date');

const MAX_TEXT = 20_000;

export function createApp(deps: AppDeps) {
  const { db, key, verifyToken, deleteAuthUser, classify } = deps;
  const now = deps.now ?? (() => new Date());
  const app = new Hono<Vars>();

  app.use(secureHeaders());
  app.use(
    cors({
      origin: deps.corsOrigins,
      allowMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Authorization', 'Content-Type'],
    }),
  );

  app.get('/health', (c) => c.json({ ok: true }));

  app.use('/v1/*', async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return c.json({ error: 'unauthorized' }, 401);
    try {
      c.set('userId', (await verifyToken(token)).userId);
    } catch {
      return c.json({ error: 'unauthorized' }, 401);
    }
    await next();
  });

  app.get('/v1/entries', zValidator('query', z.object({ from: dateKey.optional(), to: dateKey.optional() })), async (c) => {
    const rows = await listEntries(db, c.get('userId'), c.req.valid('query'));
    return c.json({ entries: rows.map((r) => openEntry(r, key)) });
  });

  app.get('/v1/entries/:date', zValidator('param', z.object({ date: dateKey })), async (c) => {
    const row = await getEntry(db, c.get('userId'), c.req.valid('param').date);
    return row ? c.json(openEntry(row, key)) : c.json({ error: 'not found' }, 404);
  });

  // Create or edit. Either way the text is (re-)scored, so scores always match what was written.
  app.put(
    '/v1/entries/:date',
    zValidator('param', z.object({ date: dateKey })),
    zValidator('json', z.object({ text: z.string().trim().min(1).max(MAX_TEXT) })),
    async (c) => {
      const userId = c.get('userId');
      const { date } = c.req.valid('param');
      const { text } = c.req.valid('json');

      // The server doesn't know the user's timezone, so allow one day ahead of UTC and no more.
      const latest = new Date(now().getTime() + 86_400_000).toISOString().slice(0, 10);
      if (date > latest) return c.json({ error: 'date is in the future' }, 400);

      let classification;
      try {
        classification = await classify(text);
      } catch (err) {
        // Nothing is saved, so the user can simply try again. Never log the text itself.
        console.error(`scoring failed: ${err instanceof Error ? err.name : 'unknown'}`);
        return c.json({ error: 'scoring_unavailable' }, 502);
      }
      const { scores, highlights } = classification;
      const row = await upsertEntry(db, { userId, entryDate: date, scores, ...sealEntry(userId, date, text, highlights, key) });
      return c.json(openEntry(row, key));
    },
  );

  app.delete('/v1/entries/:date', zValidator('param', z.object({ date: dateKey })), async (c) => {
    const removed = await deleteEntry(db, c.get('userId'), c.req.valid('param').date);
    return removed ? c.body(null, 204) : c.json({ error: 'not found' }, 404);
  });

  // Everything we hold about the user, as JSON.
  app.get('/v1/export', async (c) => {
    const rows = await listEntries(db, c.get('userId'));
    c.header('Content-Disposition', 'attachment; filename="reflex-export.json"');
    return c.json({ exportedAt: now().toISOString(), entries: rows.map((r) => openEntry(r, key)) });
  });

  // Account deletion: entries first, then the login. Safe to retry if the second step fails.
  app.delete('/v1/me', async (c) => {
    const userId = c.get('userId');
    await deleteAllEntries(db, userId);
    await deleteAuthUser(userId);
    return c.body(null, 204);
  });

  // Never log request bodies: they contain journal text.
  app.onError((err, c) => {
    console.error(`${c.req.method} ${c.req.path} failed: ${err.name}`);
    return c.json({ error: 'internal error' }, 500);
  });

  return app;
}

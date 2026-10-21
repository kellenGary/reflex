import { serve } from '@hono/node-server';
import { TypeSafeClient } from '@typesafe-ai/sdk';

import { createApp } from './app';
import { createSupabaseUserDeleter, createSupabaseVerifier } from './auth';
import { parseKey } from './crypto';
import { createDb } from './db/client';
import { loadEnv } from './env';
import { createJevClassifier } from './services/jev';

const env = loadEnv();

// One request carries the whole entry plus a question per sentence, so allow more than the 10s default.
const jev = new TypeSafeClient({ apiKey: env.JEV_API_KEY, defaultModel: env.JEV_MODEL, timeout: 30_000 });

const app = createApp({
  db: createDb(env.DATABASE_URL),
  key: parseKey(env.ENTRY_ENCRYPTION_KEY),
  verifyToken: createSupabaseVerifier(env.SUPABASE_URL),
  deleteAuthUser: createSupabaseUserDeleter(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
  classify: createJevClassifier(async (state, questions) => (await jev.systemOne({ state, questions })).answers),
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
});

serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => console.log(`reflex-server listening on :${port}`));

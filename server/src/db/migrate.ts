import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url, { max: 1 });
await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
// Row-level security references Supabase's auth.uid(), so it lives outside the generated migrations
// (which also run against plain Postgres in tests). Idempotent.
await client.unsafe(readFileSync('drizzle/rls.sql', 'utf8'));
await client.end();
console.log('migrations applied');

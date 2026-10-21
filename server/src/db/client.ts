import { drizzle } from 'drizzle-orm/postgres-js';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';

import * as schema from './schema';

/** Any Postgres driver (postgres-js in production, PGlite in tests). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDb(url: string): Db {
  // prepare:false keeps this working behind Supabase's transaction pooler.
  return drizzle(postgres(url, { prepare: false }), { schema });
}

export { schema };

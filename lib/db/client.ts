import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env, NodeEnv } from '@/lib/config/env';
import * as schema from '@/lib/db/schema';
import { assertServerOnly } from '@/lib/server-only';

assertServerOnly('lib/db/client');

// reuse a single postgres client across Next.js HMR reloads in development.
// without this, every file save creates a new client and leaks connections
// until Postgres refuses new ones.
type GlobalWithPostgres = typeof globalThis & {
	__postgresClient__?: ReturnType<typeof postgres>;
};

const globalForDb = globalThis as GlobalWithPostgres;

const client = globalForDb.__postgresClient__ ?? postgres(env.DATABASE_URL);

if (env.NODE_ENV !== NodeEnv.PRODUCTION) {
	globalForDb.__postgresClient__ = client;
}

export const db = drizzle(client, { schema });

// closes the underlying postgres client. call this from CLI scripts before exit.
export async function closeDb(): Promise<void> {
	await client.end();
}

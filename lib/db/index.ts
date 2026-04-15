import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { loadConfig } from '@/lib/config';
import * as schema from '@/lib/db/schema';

function createDb() {
	const config = loadConfig();
	const client = postgres(config.DATABASE_URL);
	const drizzleOptions = { schema };

	return drizzle(client, drizzleOptions);
}

let db: ReturnType<typeof createDb> | undefined;

export function getDb() {
	db ??= createDb();

	return db;
}

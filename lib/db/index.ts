import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/lib/config/env';
import * as schema from '@/lib/db/schema';

const client = postgres(env.DATABASE_URL);
const drizzleOptions = { schema };

export const db = drizzle(client, drizzleOptions);

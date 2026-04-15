import { defineConfig } from 'drizzle-kit';

import { env } from './lib/config/env';

const dbCredentials = { url: env.DATABASE_URL };

export default defineConfig({
	schema: './lib/db/schema.ts',
	out: './lib/db/migrations',
	dialect: 'postgresql',
	dbCredentials,
});

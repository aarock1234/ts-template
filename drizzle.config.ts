import { defineConfig } from 'drizzle-kit';

import { loadConfig } from './lib/config';

const config = loadConfig();
const dbCredentials = {
	url: config.DATABASE_URL,
};

const drizzleConfig = defineConfig({
	schema: './lib/db/schema.ts',
	out: './lib/db/migrations',
	dialect: 'postgresql',
	dbCredentials,
});

export default drizzleConfig;

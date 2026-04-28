import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import { defineConfig } from 'drizzle-kit';

const envPath = resolve(import.meta.dirname, '.env');

if (existsSync(envPath)) {
	loadEnvFile(envPath);
}

// drizzle-kit runs outside the Next.js app and only needs DATABASE_URL.
// avoid importing the full env module so migrations don't require unrelated vars
// (e.g. OPENROUTER_API_KEY) to be present.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set - drizzle-kit requires it');
}

const dbCredentials = { url: databaseUrl };

export default defineConfig({
	schema: './lib/db/schema.ts',
	out: './lib/db/migrations',
	dialect: 'postgresql',
	dbCredentials,
});

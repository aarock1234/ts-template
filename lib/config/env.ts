import { z } from 'zod';

import { assertServerOnly } from '@/lib/server-only';

assertServerOnly('lib/config/env');

export const NodeEnv = {
	DEVELOPMENT: 'development',
	PRODUCTION: 'production',
	TEST: 'test',
} as const;

export type NodeEnv = (typeof NodeEnv)[keyof typeof NodeEnv];

export const LogLevel = {
	DEBUG: 'debug',
	INFO: 'info',
	WARN: 'warn',
	ERROR: 'error',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const nodeEnvValues = Object.values(NodeEnv) as [NodeEnv, ...NodeEnv[]];
const logLevelValues = Object.values(LogLevel) as [LogLevel, ...LogLevel[]];

const envSchema = z.object({
	NODE_ENV: z.enum(nodeEnvValues).default(NodeEnv.DEVELOPMENT),
	DATABASE_URL: z.url(),
	OPENROUTER_API_KEY: z.string().min(1),
	LOG_LEVEL: z.enum(logLevelValues).default(LogLevel.INFO),
});

const skippedEnvSchema = envSchema.pick({
	NODE_ENV: true,
	LOG_LEVEL: true,
});

export type Env = z.infer<typeof envSchema>;

// parses and validates environment variables at module load.
// prints a human-readable report before re-throwing so first-run failures are obvious.
// set SKIP_ENV_VALIDATION=true to bypass in CI (e.g. `next build` without runtime secrets).
function parseEnv(): Env {
	if (process.env.SKIP_ENV_VALIDATION === 'true') {
		const result = skippedEnvSchema.safeParse(process.env);

		if (!result.success) {
			throw result.error;
		}

		// still apply defaults so non-secret consumers (pino, etc.) don't crash;
		// required fields fall through as empty strings; runtime consumers will fail loudly if used.
		return {
			NODE_ENV: result.data.NODE_ENV,
			DATABASE_URL: process.env.DATABASE_URL ?? '',
			OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? '',
			LOG_LEVEL: result.data.LOG_LEVEL,
		};
	}

	const result = envSchema.safeParse(process.env);

	if (result.success) {
		return result.data;
	}

	const issues = result.error.issues.map(issue => {
		const path = issue.path.join('.');

		return ` - ${path}: ${issue.message}`;
	});

	const message = ['invalid environment variables - check your .env file:', ...issues].join('\n');

	throw new Error(message);
}

export const env = parseEnv();

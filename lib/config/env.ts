import { z } from 'zod';

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

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

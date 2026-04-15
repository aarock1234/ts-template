import { z } from 'zod';

export enum NodeEnv {
	Development = 'development',
	Production = 'production',
	Test = 'test',
}

export enum LogLevel {
	Debug = 'debug',
	Info = 'info',
	Warn = 'warn',
	Error = 'error',
}

const envSchema = z.object({
	NODE_ENV: z.enum(NodeEnv).default(NodeEnv.Development),
	DATABASE_URL: z.url(),
	OPENROUTER_API_KEY: z.string().min(1),
	LOG_LEVEL: z.enum(LogLevel).default(LogLevel.Info),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

import { z } from 'zod';

const configSchema = z.object({
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
	DATABASE_URL: z.string().url(),
	OPENROUTER_API_KEY: z.string().min(1),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

let cached: Config | undefined;

export function loadConfig(): Config {
	if (cached) {
		return cached;
	}

	const result = configSchema.safeParse(process.env);

	if (!result.success) {
		const formatted = result.error.issues.map(issue => `  ${issue.path.join('.')}: ${issue.message}`).join('\n');
		throw new Error(`invalid config:\n${formatted}`);
	}

	cached = result.data;

	return cached;
}

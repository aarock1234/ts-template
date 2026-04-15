import { setTimeout } from 'node:timers/promises';

export type RetryOptions = {
	maxAttempts?: number;
	initialDelay?: number;
	maxDelay?: number;
	multiplier?: number;
	signal?: AbortSignal;
};

// retries fn with exponential backoff and full jitter.
export async function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
	const maxAttempts = options?.maxAttempts ?? 3;
	const initialDelay = options?.initialDelay ?? 1000;
	const maxDelay = options?.maxDelay ?? 10_000;
	const multiplier = options?.multiplier ?? 2;
	const signal = options?.signal;

	let lastError: unknown;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			if (attempt === maxAttempts - 1) break;

			// full jitter: sleep = random(0, min(initialDelay * multiplier^attempt, maxDelay))
			const ceiling = Math.min(initialDelay * multiplier ** attempt, maxDelay);
			const delay = Math.random() * ceiling;

			await setTimeout(delay, undefined, { signal });
		}
	}

	throw lastError;
}

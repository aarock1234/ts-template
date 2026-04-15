import { setTimeout } from 'node:timers/promises';

export type RetryOptions = {
	maxAttempts?: number;
	baseDelay?: number;
	maxDelay?: number;
	multiplier?: number;
	signal?: AbortSignal;
};

// retries fn with exponential backoff and full jitter.
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	const maxAttempts = options.maxAttempts ?? 3;
	const baseDelay = options.baseDelay ?? 1000;
	const maxDelay = options.maxDelay ?? 10_000;
	const multiplier = options.multiplier ?? 2;
	const signal = options.signal;

	let lastError: unknown;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
		}

		// don't sleep after the final attempt
		if (attempt + 1 < maxAttempts) {
			const ceiling = Math.min(baseDelay * multiplier ** attempt, maxDelay);
			const delay = Math.random() * ceiling;
			const timerOptions = { signal };

			await setTimeout(delay, undefined, timerOptions);
		}
	}

	throw lastError;
}

import { setTimeout } from 'node:timers/promises';

export type ShouldRetry = (error: unknown, attempt: number) => boolean;

export type RetryOptions = {
	maxAttempts?: number;
	baseDelay?: number;
	maxDelay?: number;
	multiplier?: number;
	signal?: AbortSignal;
	shouldRetry?: ShouldRetry;
};

// retries fn with exponential backoff and full jitter.
// shouldRetry controls which errors trigger another attempt — defaults to always retry.
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	const maxAttempts = options.maxAttempts ?? 3;
	const baseDelay = options.baseDelay ?? 1000;
	const maxDelay = options.maxDelay ?? 10_000;
	const multiplier = options.multiplier ?? 2;
	const signal = options.signal;
	const shouldRetry = options.shouldRetry ?? alwaysRetry;

	signal?.throwIfAborted();

	let lastError: unknown;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			const isLastAttempt = attempt + 1 >= maxAttempts;

			if (isLastAttempt || !shouldRetry(error, attempt)) {
				throw error;
			}
		}

		const ceiling = Math.min(baseDelay * multiplier ** attempt, maxDelay);
		const delay = Math.random() * ceiling;
		const timerOptions = { signal };

		await setTimeout(delay, undefined, timerOptions);
	}

	throw lastError;
}

function alwaysRetry(): boolean {
	return true;
}

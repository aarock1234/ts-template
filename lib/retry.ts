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

// retries operation with exponential backoff and full jitter.
// shouldRetry controls which errors trigger another attempt — defaults to always retry.
export async function retry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	const maxAttempts = options.maxAttempts ?? 3;
	const baseDelay = options.baseDelay ?? 1000;
	const maxDelay = options.maxDelay ?? 10_000;
	const multiplier = options.multiplier ?? 2;
	const signal = options.signal;
	const shouldRetry = options.shouldRetry ?? alwaysRetry;

	validateRetryOptions({
		maxAttempts,
		baseDelay,
		maxDelay,
		multiplier,
	});

	signal?.throwIfAborted();

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			const isLastAttempt = attempt + 1 >= maxAttempts;

			if (isLastAttempt || !shouldRetry(error, attempt)) {
				throw error;
			}
		}

		const ceiling = Math.min(baseDelay * multiplier ** attempt, maxDelay);
		const delay = Math.random() * ceiling;

		await setTimeout(delay, undefined, { signal });
	}

	throw new Error('retry loop exited unexpectedly');
}

function alwaysRetry(): boolean {
	return true;
}

function validateRetryOptions(
	options: Required<Pick<RetryOptions, 'maxAttempts' | 'baseDelay' | 'maxDelay' | 'multiplier'>>
): void {
	if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
		throw new Error('maxAttempts must be a positive integer');
	}

	if (!Number.isFinite(options.baseDelay) || options.baseDelay < 0) {
		throw new Error('baseDelay must be a non-negative finite number');
	}

	if (!Number.isFinite(options.maxDelay) || options.maxDelay < 0) {
		throw new Error('maxDelay must be a non-negative finite number');
	}

	if (!Number.isFinite(options.multiplier) || options.multiplier < 1) {
		throw new Error('multiplier must be a finite number greater than or equal to 1');
	}
}

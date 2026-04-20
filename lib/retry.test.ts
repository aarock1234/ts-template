import { describe, expect, it, vi } from 'vitest';

import { retry } from '@/lib/retry';

describe('retry', () => {
	it('returns the value on first success', async () => {
		const fn = vi.fn().mockResolvedValue('ok');
		const retryOptions = { maxAttempts: 3 };

		const result = await retry(fn, retryOptions);

		expect(result).toBe('ok');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('retries up to maxAttempts on failure', async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error('fail 1'))
			.mockRejectedValueOnce(new Error('fail 2'))
			.mockResolvedValue('ok');
		const retryOptions = { maxAttempts: 3, baseDelay: 1 };

		const result = await retry(fn, retryOptions);

		expect(result).toBe('ok');
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('throws the last error after exhausting attempts', async () => {
		const fn = vi.fn().mockRejectedValue(new Error('persistent'));
		const retryOptions = { maxAttempts: 2, baseDelay: 1 };

		await expect(retry(fn, retryOptions)).rejects.toThrow('persistent');
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('stops early when shouldRetry returns false', async () => {
		const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
		const retryOptions = {
			maxAttempts: 5,
			baseDelay: 1,
			shouldRetry: () => false,
		};

		await expect(retry(fn, retryOptions)).rejects.toThrow('non-retryable');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('throws immediately if the signal is already aborted', async () => {
		const fn = vi.fn().mockResolvedValue('ok');
		const controller = new AbortController();
		controller.abort();

		const retryOptions = { signal: controller.signal };

		await expect(retry(fn, retryOptions)).rejects.toThrow();
		expect(fn).not.toHaveBeenCalled();
	});
});

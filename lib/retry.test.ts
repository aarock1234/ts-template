import { describe, expect, it, vi } from 'vitest';

import { retry } from '@/lib/retry';

describe('retry', () => {
	it('returns the value on first success', async () => {
		const operation = vi.fn().mockResolvedValue('ok');

		const result = await retry(operation, { maxAttempts: 3 });

		expect(result).toBe('ok');
		expect(operation).toHaveBeenCalledTimes(1);
	});

	it('retries up to maxAttempts on failure', async () => {
		const operation = vi
			.fn()
			.mockRejectedValueOnce(new Error('fail 1'))
			.mockRejectedValueOnce(new Error('fail 2'))
			.mockResolvedValue('ok');

		const result = await retry(operation, {
			maxAttempts: 3,
			baseDelay: 1,
		});

		expect(result).toBe('ok');
		expect(operation).toHaveBeenCalledTimes(3);
	});

	it('throws the last error after exhausting attempts', async () => {
		const operation = vi.fn().mockRejectedValue(new Error('persistent'));

		await expect(
			retry(operation, {
				maxAttempts: 2,
				baseDelay: 1,
			})
		).rejects.toThrow('persistent');
		expect(operation).toHaveBeenCalledTimes(2);
	});

	it('stops early when shouldRetry returns false', async () => {
		const operation = vi.fn().mockRejectedValue(new Error('non-retryable'));
		const retryOptions = {
			maxAttempts: 5,
			baseDelay: 1,
			shouldRetry: () => false,
		};

		await expect(retry(operation, retryOptions)).rejects.toThrow('non-retryable');
		expect(operation).toHaveBeenCalledTimes(1);
	});

	it('throws immediately if the signal is already aborted', async () => {
		const operation = vi.fn().mockResolvedValue('ok');
		const controller = new AbortController();
		controller.abort();

		await expect(retry(operation, { signal: controller.signal })).rejects.toThrow();
		expect(operation).not.toHaveBeenCalled();
	});

	it('rejects invalid retry options before running the function', async () => {
		const operation = vi.fn().mockResolvedValue('ok');

		await expect(retry(operation, { maxAttempts: 0 })).rejects.toThrow('maxAttempts must be a positive integer');
		expect(operation).not.toHaveBeenCalled();
	});
});

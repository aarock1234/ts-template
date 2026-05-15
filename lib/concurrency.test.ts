import { describe, expect, it, vi } from 'vitest';

import { mapConcurrent, mapConcurrentSettled } from '@/lib/concurrency';

describe('mapConcurrent', () => {
	it('maps items with a concurrency limit', async () => {
		let activeCount = 0;
		let maxActiveCount = 0;
		const items = [1, 2, 3, 4];

		const result = await mapConcurrent(
			items,
			async item => {
				activeCount += 1;
				maxActiveCount = Math.max(maxActiveCount, activeCount);

				await Promise.resolve();

				activeCount -= 1;

				return item * 2;
			},
			{ concurrency: 2 }
		);

		expect(result).toEqual([2, 4, 6, 8]);
		expect(maxActiveCount).toBeLessThanOrEqual(2);
	});

	it('rejects invalid concurrency before running tasks', async () => {
		const items = [1];
		const mapper = vi.fn().mockResolvedValue(1);

		await expect(mapConcurrent(items, mapper, { concurrency: 0 })).rejects.toThrow(
			'concurrency must be a positive integer'
		);
		expect(mapper).not.toHaveBeenCalled();
	});

	it('does not run mappers when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		const mapper = vi.fn().mockResolvedValue(1);

		await expect(mapConcurrent([1, 2, 3], mapper, { signal: controller.signal })).rejects.toThrow();
		expect(mapper).not.toHaveBeenCalled();
	});

	it('stops running mappers after the signal aborts mid-batch', async () => {
		const controller = new AbortController();
		const mapper = vi.fn(async (item: number) => {
			await Promise.resolve();

			if (item === 1) {
				controller.abort();
			}

			return item;
		});

		await expect(
			mapConcurrent([1, 2, 3], mapper, {
				concurrency: 1,
				signal: controller.signal,
			})
		).rejects.toThrow();
		expect(mapper).toHaveBeenCalledTimes(1);
	});

	it('rejects the batch when any mapper rejects', async () => {
		const mapper = vi.fn(async (item: number) => {
			await Promise.resolve();

			if (item === 2) {
				throw new Error('failed item');
			}

			return item * 2;
		});

		await expect(mapConcurrent([1, 2, 3], mapper, { concurrency: 1 })).rejects.toThrow('failed item');
	});
});

describe('mapConcurrentSettled', () => {
	it('collects fulfilled and rejected results', async () => {
		const items = [1, 2];

		const result = await mapConcurrentSettled(
			items,
			async item => {
				await Promise.resolve();

				if (item === 2) {
					throw new Error('failed item');
				}

				return item;
			},
			{ concurrency: 2 }
		);

		expect(result[0]).toEqual({
			status: 'fulfilled',
			value: 1,
		});
		expect(result[1]).toMatchObject({ status: 'rejected' });
	});
});

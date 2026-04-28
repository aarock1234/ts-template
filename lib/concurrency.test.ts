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

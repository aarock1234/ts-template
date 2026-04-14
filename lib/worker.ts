import pLimit from 'p-limit';

export type MapAllOptions = {
	concurrency?: number;
	signal?: AbortSignal;
};

// processes items concurrently with a sliding window limit.
// respects AbortSignal for cancellation.
export async function mapAll<T, R>(items: T[], fn: (item: T) => Promise<R>, options?: MapAllOptions): Promise<R[]> {
	const concurrency = options?.concurrency ?? 10;
	const signal = options?.signal;
	const limit = pLimit(concurrency);

	return Promise.all(
		items.map(item =>
			limit(() => {
				signal?.throwIfAborted();
				return fn(item);
			})
		)
	);
}

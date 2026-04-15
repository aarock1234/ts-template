import pLimit from 'p-limit';

export type ConcurrencyOptions = {
	concurrency?: number;
	signal?: AbortSignal;
};

// maps items concurrently with a sliding window limit.
// fails fast — one rejection rejects the entire batch.
export async function mapConcurrent<T, R>(
	items: T[],
	fn: (item: T) => Promise<R>,
	options: ConcurrencyOptions = {}
): Promise<R[]> {
	const concurrency = options.concurrency ?? 10;
	const signal = options.signal;
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

// maps items concurrently, collecting all results regardless of individual failures.
// individual fn errors are captured as rejected results; abort signal still kills the batch.
export async function mapConcurrentSettled<T, R>(
	items: T[],
	fn: (item: T) => Promise<R>,
	options: ConcurrencyOptions = {}
): Promise<PromiseSettledResult<R>[]> {
	const concurrency = options.concurrency ?? 10;
	const signal = options.signal;
	const limit = pLimit(concurrency);

	return Promise.all(
		items.map(item =>
			limit(async (): Promise<PromiseSettledResult<R>> => {
				signal?.throwIfAborted();

				try {
					const value = await fn(item);

					return { status: 'fulfilled', value };
				} catch (reason) {
					return { status: 'rejected', reason };
				}
			})
		)
	);
}

import pLimit from 'p-limit';

export type ConcurrencyOptions = {
	concurrency?: number;
	signal?: AbortSignal;
};

const DEFAULT_CONCURRENCY = 10;

// maps items concurrently with a sliding window limit.
// fails fast — one rejection rejects the entire batch.
export async function mapConcurrent<T, R>(
	items: readonly T[],
	mapper: (item: T) => Promise<R>,
	options: ConcurrencyOptions = {}
): Promise<R[]> {
	const limit = makeLimit(options);
	const tasks: Promise<R>[] = [];

	for (const item of items) {
		const task = limit(() => {
			options.signal?.throwIfAborted();

			return mapper(item);
		});

		tasks.push(task);
	}

	return Promise.all(tasks);
}

// maps items concurrently, collecting all results regardless of individual failures.
// individual mapper errors are captured as rejected results; abort signal still kills the batch.
export async function mapConcurrentSettled<T, R>(
	items: readonly T[],
	mapper: (item: T) => Promise<R>,
	options: ConcurrencyOptions = {}
): Promise<PromiseSettledResult<R>[]> {
	const limit = makeLimit(options);
	const tasks: Promise<PromiseSettledResult<R>>[] = [];

	for (const item of items) {
		const task = limit(async (): Promise<PromiseSettledResult<R>> => {
			options.signal?.throwIfAborted();

			try {
				const value = await mapper(item);

				return {
					status: 'fulfilled',
					value,
				};
			} catch (reason) {
				return {
					status: 'rejected',
					reason,
				};
			}
		});

		tasks.push(task);
	}

	return Promise.all(tasks);
}

function makeLimit(options: ConcurrencyOptions) {
	const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

	if (!Number.isInteger(concurrency) || concurrency < 1) {
		throw new Error('concurrency must be a positive integer');
	}

	return pLimit(concurrency);
}

'use client';

export default function ErrorPage({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<h2 className="text-xl">something went wrong</h2>
			<button className="rounded border px-4 py-2 text-sm hover:bg-gray-50" onClick={reset}>
				try again
			</button>
		</div>
	);
}

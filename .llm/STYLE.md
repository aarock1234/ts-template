# TypeScript Style Guide

Project-specific TypeScript style guide. Favor idiomatic TypeScript, React, and Next.js over clever abstractions.

**Runtime**: Node.js 24+.
**Package manager**: pnpm.

## Philosophy

Write boring code. Prefer explicit over implicit. Optimize for reading, not writing. Let TypeScript, ESLint, Prettier, and framework conventions do their jobs. Add abstractions only when they remove real complexity.

When guidance conflicts, use this order:

1. Correctness, security, and runtime behavior.
2. Official framework and library idioms.
3. Existing local patterns.
4. This guide.

Examples in this file show shape and intent. Do not cargo-cult them into mandatory ceremony. If a small inline value is clearer than a named variable, inline it. If a named variable explains intent, name it.

## Quick Reference

### Tools

```bash
pnpm dev                     # start Next.js dev server
pnpm build                   # production build
pnpm lint                    # lint with ESLint
pnpm format                  # format with Prettier
pnpm format:check            # check formatting
pnpm typecheck               # Next route types + TypeScript
pnpm test                    # run Vitest
pnpm check                   # local verification bundle
pnpm db:generate             # generate Drizzle migrations
pnpm db:migrate              # apply Drizzle migrations
pnpm db:studio               # open Drizzle Studio
pnpm script scripts/foo.ts   # run a CLI script with env loading
```

Use `pnpm` for package management. Use `pnpm dlx` for one-off commands. Do not use `npm`, `npx`, or `yarn` in this project.

### Import Order

Group imports as external packages, internal path aliases, then relative imports. Use `import type` for type-only imports.

```typescript
import { generateText, Output } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/log';

import { processDocument } from './process-document';
import type { DocumentResult } from './process-document';
```

Side-effect imports should be rare. When needed, keep them visibly separate and comment why the import exists.

### Naming

Use normal TypeScript naming.

| Category                      | Convention | Examples                              |
| ----------------------------- | ---------- | ------------------------------------- |
| Functions and variables       | camelCase  | `loadPrompt`, `modelId`               |
| Types and classes             | PascalCase | `RetryOptions`, `AppError`            |
| Const objects used like enums | PascalCase | `NodeEnv`, `LogLevel`                 |
| Zod schemas                   | camelCase  | `summarySchema`                       |
| Files                         | kebab-case | `server-only.ts`, `document-store.ts` |

Boolean names should read like questions when practical: `isReady`, `hasToken`, `shouldRetry`.

Do not contort names to match a pattern. A name that clearly describes the local concept wins.

## Modules and Exports

Use named exports for normal modules. Default exports are fine when a framework expects them, such as Next.js pages, layouts, error boundaries, and route handlers.

Avoid barrel files that only re-export other modules. Import from the concrete module that owns the code.

```typescript
// Good: direct imports from owning modules.
import { db } from '@/lib/db/client';
import { retry } from '@/lib/retry';

// Avoid: broad barrel imports hide ownership.
import { db, retry } from '@/lib';
```

An `index.ts` file is fine when it is a real implementation module. The problem is re-export barrels, not the filename itself.

Keep server-only and client-safe modules separate:

- Server-only modules may read env vars, secrets, the filesystem, or database clients.
- Client components must not import server-only modules.
- Shared pure helpers should not import server-only state.

## Formatting

Let Prettier format code. Do not manually reshape code around arbitrary line breaks.

Inline small objects when that is clearer:

```typescript
return Response.json({ status: 'error' }, { status: 503 });
```

Use multi-line objects for semantic records, nested options, and arrays of objects. This is especially important for AI SDK messages, Drizzle column definitions, route payloads with multiple fields, and provider options.

```typescript
const messages: ModelMessage[] = [
	{
		role: 'user',
		content: document.content,
	},
];

const documentInput = {
	title: document.title,
	content: document.content,
	source: document.source,
};
```

Name values when the name explains intent, the value is reused, or the inline expression becomes noisy:

```typescript
const retryOptions = {
	maxAttempts: retries + 1,
	signal: generateParams.abortSignal,
};

return retry(runGeneration, retryOptions);
```

Use blank lines to separate logical groups inside a function. Closely related lines can stay together. If three or more unrelated statements stack up, split them into small groups.

```typescript
async function processItems(items: readonly Item[]): Promise<number> {
	let total = 0;

	for (const item of items) {
		if (!item.isValid) {
			continue;
		}

		const value = await transform(item);
		total += value;
	}

	if (total === 0) {
		throw new Error('no valid items to process');
	}

	return total;
}
```

Array methods are good when the operation stays obvious. Prefer a plain loop when a chain mixes filtering, async work, mutation, branching, or error handling. Loops are often more idiomatic than clever pipelines in application code.

## Functions and Control Flow

Use function declarations for exported and top-level functions. Use arrow functions for callbacks and short inline expressions.

```typescript
export function loadPrompt(name: string): string {
	return readPrompt(name);
}

const names = users.map(user => user.name);
```

Write explicit return types on exported functions. Internal helpers can rely on inference when it is obvious.

Prefer guard clauses for invalid states and early exits:

```typescript
function requireInput(input: string | undefined): string {
	if (!input) {
		throw new Error('--input is required');
	}

	return input;
}
```

Use `async`/`await` instead of promise chains. Do not mark a function `async` unless it awaits or intentionally returns a promise from an async API.

Use ternaries for simple expressions. Avoid nested ternaries; extract a helper when the logic starts to branch.

```typescript
const label = isActive ? 'active' : 'inactive';

function roleLabel(role: Role): string {
	switch (role) {
		case Role.ADMIN:
			return 'admin';
		case Role.USER:
			return 'user';
	}
}
```

### Collection Transformations

Use `map`, `filter`, and `reduce` when the transformation is short and obvious. Use `for...of` when the work has branching, async operations, multiple outputs, logging, error handling, or named intermediate steps.

```typescript
// Good: obvious one-step transformation.
const titles = documents.map(document => document.title);

// Good: loop makes the branching and side effects visible.
const summaries: Summary[] = [];

for (const document of documents) {
	if (document.content.trim() === '') {
		continue;
	}

	const summary = await summarize(document);
	summaries.push(summary);
}
```

Avoid `reduce` for code that has to be mentally executed to understand it. A few extra lines with `let total = 0` is often clearer.

### API Design

Design exported functions around the caller. Keep the call site readable.

Use positional arguments for one or two obvious required values. Use an options object when there are optional settings, booleans, callbacks, or more than two parameters.

```typescript
// Good: required value + optional behavior.
export function loadPrompt(name: string, vars: PromptVars = {}): string {
	// ...
}

// Good: options object keeps the call site self-documenting.
export async function retry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	// ...
}

await retry(fetchDocument, {
	maxAttempts: 3,
	signal,
});
```

Avoid boolean parameters in public APIs. They make call sites cryptic.

```typescript
// Avoid: what does true mean?
await generateSummary(document, true);

// Better: caller names the behavior.
await generateSummary(document, { includeKeyPoints: true });
```

Return concrete values. Do not wrap everything in a custom `Result` type unless the codebase has committed to that pattern. In TypeScript application code, throwing at internal layers and handling at boundaries is usually clearer.

Use generics when they preserve information for the caller. Avoid generics that only make implementation code look abstract.

```typescript
// Good: schema determines the return type.
export async function structured<T extends z.ZodType>(schema: T, options: StructuredOptions): Promise<z.infer<T>> {
	// ...
}

// Avoid: generic name with no useful constraint or caller benefit.
function process<T>(value: T): T {
	return value;
}
```

Name callback parameters after their role when the function is exported or reused. `callback` is acceptable when the role is literally a callback. `fn` is fine in tiny local helpers, but names like `operation`, `mapper`, `predicate`, `loader`, or `task` usually read better at API boundaries.

### Abstractions and Classes

Prefer plain functions and modules. Add classes only when you need stateful instances with multiple methods that share private state.

```typescript
// Good: module-level function for stateless behavior.
export function schemaBlock(schema: z.ZodType): string {
	return `\`\`\`json\n${JSON.stringify(toJSONSchema(schema), null, 2)}\n\`\`\``;
}

// Good: class when the instance owns state and behavior.
export class RateLimiter {
	readonly #limit: number;
	#activeCount = 0;

	constructor(limit: number) {
		this.#limit = limit;
	}

	canStart(): boolean {
		return this.#activeCount < this.#limit;
	}
}
```

Avoid manager/service classes that only group unrelated functions. A file with named exports is simpler until shared state or a stable public object model appears.

Do not introduce interfaces before there is a second implementation or a useful test seam. Accepting a tiny structural type at the consumer can be clearer than exporting a broad abstraction from the producer.

## Type Safety

Avoid `any`. Use concrete types, generics, or `unknown` with narrowing.

```typescript
// Good: caller gets a typed value.
function parseJson<T>(text: string, schema: z.ZodType<T>): T {
	return schema.parse(JSON.parse(text));
}

// Good: unknown forces validation before use.
function readPayload(value: unknown): Payload {
	return payloadSchema.parse(value);
}
```

Prefer `type` for data shapes, unions, and function signatures. Use `interface` when declaration merging or class implementation contracts are useful.

```typescript
type DocumentInput = {
	title: string;
	content: string;
};

type Handler = (request: Request) => Promise<Response>;
```

Use `satisfies` when checking object shape while preserving literal types:

```typescript
const providerOptions = {
	reasoningOff: {
		openrouter: {
			reasoning: {
				enabled: false,
				effort: 'none',
			},
		},
	},
} as const satisfies Record<string, ProviderOptions>;
```

Avoid non-null assertions. Narrow explicitly or throw a useful error.

```typescript
const user = await getUser(id);

if (!user) {
	throw new NotFoundError(`user ${id}`);
}

return user.email;
```

Use const objects with string literal values for enum-like values that are serialized, logged, or shared across boundaries.

```typescript
export const NodeEnv = {
	DEVELOPMENT: 'development',
	PRODUCTION: 'production',
	TEST: 'test',
} as const;

export type NodeEnv = (typeof NodeEnv)[keyof typeof NodeEnv];
```

## Zod and Validation

Validate untrusted data with Zod or a structured parser. Keep schemas near the code that owns the data shape.

Define the schema first, then infer the TypeScript type.

```typescript
const createDocumentSchema = z.object({
	title: z.string().min(1),
	content: z.string().min(1),
});

type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
```

Use `parse` at boundaries where invalid data should throw and be handled by the boundary. Use `safeParse` when the local function can recover or return a typed error.

```typescript
export async function POST(request: Request): Promise<Response> {
	const body = await request.json();
	const input = createDocumentSchema.parse(body);

	const document = await createDocument(input);

	return Response.json(document, { status: 201 });
}
```

For AI structured output, include metadata when it helps the model produce better fields.

```typescript
const summarySchema = z
	.object({
		title: z.string().meta({ description: 'a short title for the document' }),
		keyPoints: z.array(z.string()).meta({ description: 'main points from the text' }),
	})
	.meta({
		title: 'DocumentSummary',
		description: 'a structured summary of a document',
	});
```

## Errors

Throw errors with useful context. Log at boundaries such as route handlers, server actions, CLI entrypoints, and background workers.

Handle an error or propagate it; do not log and rethrow from internal helpers.

```typescript
// Good: internal helper adds context by throwing.
async function requireDocument(id: string): Promise<Document> {
	const document = await findDocument(id);

	if (!document) {
		throw new NotFoundError(`document ${id}`);
	}

	return document;
}

// Good: boundary logs once.
export async function GET(): Promise<Response> {
	try {
		const documents = await listDocuments();

		return Response.json(documents);
	} catch (error) {
		logger.error({ err: error }, 'list documents failed');

		return Response.json({ error: 'internal error' }, { status: 500 });
	}
}
```

Error messages should be lowercase and have no trailing punctuation.

### Programmer Errors vs Operational Errors

TypeScript has `throw`, not panics, but the distinction still matters.

Throw for programmer errors and violated invariants: impossible states, invalid options, missing required configuration, or a branch that should be unreachable. These should fail loudly because continuing would hide a bug.

```typescript
function assertPositiveInteger(value: number, name: string): void {
	if (!Number.isInteger(value) || value < 1) {
		throw new Error(`${name} must be a positive integer`);
	}
}
```

Operational errors are expected failures from the world: network errors, invalid user input, missing rows, rejected model calls. Add context and let the boundary decide how to report them.

```typescript
async function requireDocument(id: string): Promise<Document> {
	const document = await findDocument(id);

	if (!document) {
		throw new NotFoundError(`document ${id}`);
	}

	return document;
}
```

Use `process.exit` only at CLI process boundaries. Prefer `run().catch(...)` so cleanup and logging have one clear place.

Use custom error classes for expected domain errors that callers need to branch on:

```typescript
type AppErrorOptions = {
	cause?: unknown;
};

export class AppError extends Error {
	readonly code: string;
	readonly statusCode: number;

	constructor(message: string, code: string, statusCode = 500, options?: AppErrorOptions) {
		super(message, options);
		this.name = this.constructor.name;
		this.code = code;
		this.statusCode = statusCode;
	}
}
```

## Async and Concurrency

Use `Promise.all` for independent work that must all succeed.

```typescript
const [user, settings] = await Promise.all([getUser(userId), getSettings(userId)]);
```

Use `Promise.allSettled` when partial failure is expected and the caller can handle it.

```typescript
const summaryTasks = documents.map(document => summarize(document));
const results = await Promise.allSettled(summaryTasks);
```

Use bounded concurrency for large batches or external services with rate limits. Prefer a sliding-window limiter such as `p-limit` over chunked batches.

```typescript
const limit = pLimit(10);
const summaryTasks = documents.map(document => limit(() => summarize(document)));
const summaries = await Promise.all(summaryTasks);
```

Accept `AbortSignal` for long-running operations that may be canceled. Check the signal before starting work and pass it to APIs that support cancellation.

```typescript
export async function retry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	options.signal?.throwIfAborted();

	return operation();
}
```

### Promise Formatting

Prefer naming task arrays before awaiting them. This makes concurrency visible, gives the mapped work a name, and keeps `Promise.all` from becoming a nested expression. Inline `Promise.all(items.map(...))` is acceptable only for tiny local code where the mapping is a single obvious call.

```typescript
// Good: the concurrent work has a name.
const userTasks = userIds.map(userId => getUser(userId));
const users = await Promise.all(userTasks);

// Good: named tasks are much easier to scan once behavior appears.
const generationTasks = documents.map(document =>
	limit(async () => {
		const prompt = loadPrompt('summarize', {
			TITLE: document.title,
		});
		const messages: ModelMessage[] = [
			{
				role: 'user',
				content: document.content,
			},
		];

		return structured(summarySchema, {
			model,
			system: prompt,
			messages,
		});
	})
);

const summaries = await Promise.all(generationTasks);
```

Prefer `for...of` when tasks must run sequentially or when each step depends on the previous result. Do not use `Promise.all` just because it looks concise; use it because concurrency is correct.

### Cleanup and Shutdown

Use `try/finally` for resources that must close after async work. Ignore cleanup errors only when they are not actionable; otherwise log them at the boundary.

```typescript
const client = createClient();

try {
	await client.connect();
	await runJob(client);
} finally {
	await client.close();
}
```

CLI scripts should handle `SIGINT` and `SIGTERM` when they may run long enough to need cancellation. Thread an `AbortSignal` through the work instead of using global flags.

## Environment and Configuration

Centralize runtime configuration in `lib/config/env.ts`. Validate environment variables once and import typed config from there.

```typescript
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	DATABASE_URL: z.url(),
	OPENROUTER_API_KEY: z.string().min(1),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = envSchema.parse(process.env);
```

Config files that run outside Next.js, such as `drizzle.config.ts`, may read `process.env` directly when importing the full env module would require unrelated secrets.

Use `SKIP_ENV_VALIDATION=true` only for build-time or CI paths that should not require runtime secrets.

Server-only modules may read env vars, secrets, the filesystem, or database clients. Client components must not import them.

## Logging

Use Pino for structured logging. Put structured data first and the message second. Use child loggers when stable context applies to several lines.

```typescript
const log = logger.child({ script: 'ingest-documents' });

log.info({ count: documents.length }, 'documents loaded');
log.error(
	{
		err: error,
		documentId,
	},
	'document processing failed'
);
```

Use `console.log` only for intentional CLI output. Use the logger for diagnostics.

Log messages should be lowercase and stable. Put dynamic values in structured fields instead of interpolating them into the message.

```typescript
// Good
logger.info({ userId }, 'user created');

// Avoid
logger.info(`user ${userId} created`);
```

Client-only error boundaries cannot use the server logger. Use `console.error` there for render diagnostics, and keep the message stable.

## Next.js

Server components are the default. Use client components only for browser APIs, event handlers, or hooks.

Push `'use client'` as far down the component tree as practical.

```typescript
// Server component by default.
export default async function DocumentsPage() {
	const documents = await listDocuments();

	return <DocumentList documents={documents} />;
}
```

Route handlers should validate input, call library code, and translate known errors into HTTP responses. Keep business logic in `lib/`.

```typescript
export async function GET(): Promise<Response> {
	try {
		const documents = await listDocuments();

		return Response.json(documents);
	} catch (error) {
		logger.error({ err: error }, 'list documents failed');

		return Response.json({ error: 'internal error' }, { status: 500 });
	}
}
```

Small responses can be inline:

```typescript
return Response.json({ status: 'ok' });
```

Name response bodies only when the name improves readability or the value is reused.

### Route Handlers

Route handlers are transport boundaries. They should be thin: parse input, call library code, translate known failures, and log unexpected failures.

```typescript
export async function POST(request: Request): Promise<Response> {
	try {
		const body = await request.json();
		const input = createDocumentSchema.parse(body);

		const document = await createDocument(input);

		return Response.json(document, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return Response.json(
				{
					error: 'invalid request',
					details: error.flatten(),
				},
				{ status: 400 }
			);
		}

		logger.error({ err: error }, 'create document failed');

		return Response.json({ error: 'internal error' }, { status: 500 });
	}
}
```

Avoid hiding simple route behavior behind a generic handler factory. Extract only when multiple routes share real behavior, not just the same shape.

### Data Boundaries

Keep database clients, filesystem access, provider secrets, and prompt loading on the server side. Pass plain serializable data into client components.

```typescript
export default async function DocumentsPage() {
	const documents = await listDocuments();

	return <DocumentsView documents={documents} />;
}
```

If a client component needs to trigger server work, use a route handler or server action deliberately. Do not import server-only helpers into a client component because it happens to typecheck.

## React Components

Keep components small and data flow explicit. Co-locate component-specific helpers with the component.

Extract a shared component only when it has a real second caller or the extraction makes the current file easier to understand.

Prefer server components for data fetching. Use client components for interaction.

```typescript
'use client';

import { useState } from 'react';

export function SearchInput({ onSearch }: { onSearch: (query: string) => void }) {
	const [query, setQuery] = useState('');

	return (
		<input
			value={query}
			onChange={event => setQuery(event.target.value)}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					onSearch(query);
				}
			}}
		/>
	);
}
```

Use descriptive prop types near the component. If props are only used by one component, keep the type next to that component.

## Database

Keep Drizzle schema definitions in `lib/db/schema.ts`. Infer row and insert types from the schema.

```typescript
export const documents = pgTable('documents', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
```

Use `lib/db/client.ts` for the database client. Import it directly from call sites that need database access.

```typescript
import { db } from '@/lib/db/client';
import { documents } from '@/lib/db/schema';
```

Generate migrations for schema changes. Use `db:push` only for local development when migrations are intentionally skipped.

Do not hide Drizzle queries behind generic repository abstractions unless there is real domain behavior to encapsulate. A small project can query directly from route handlers or focused library functions.

## AI SDK and Prompts

Keep provider setup in `lib/ai/provider.ts`. Choose models at call sites unless a real product-level default exists.

```typescript
const result = await structured(summarySchema, {
	model: openrouter(modelId),
	system,
	messages,
	providerOptions: providerOptions.reasoningOff,
});
```

Use Zod schemas for structured output. Keep schema descriptions concise and useful to the model.

Keep prompt templates in `prompts/`. Use explicit placeholders for dynamic content and fail fast when a prompt has unresolved placeholders or unused variables.

```typescript
const system = loadPrompt('summarize-document', {
	RESPONSE_SCHEMA: schemaBlock(summarySchema),
});
```

Do not put business logic in prompts. Prompts should express model instructions; application code should validate, persist, retry, and decide what happens next.

Keep AI wrappers thin. A wrapper is useful when it centralizes validation, retries, logging, or provider-specific defaults. A wrapper that only renames an SDK function adds indirection without buying much.

```typescript
// Good: wrapper adds schema typing, retry behavior, and the null-output guard.
const summary = await structured(summarySchema, {
	model: openrouter(modelId),
	system,
	messages,
});

// Avoid: wrapper only hides the SDK call and invents a second API.
const summary = await aiService.generateStructuredSummary(document);
```

Prompts are not configuration stores. Keep model IDs, retry counts, persistence decisions, and branching logic in TypeScript where they can be typed and tested.

## CLI Scripts

Scripts in `scripts/` should parse arguments, wire library functions together, log at the boundary, and exit with a clear status.

```typescript
import { parseArgs } from 'node:util';

import { logger } from '@/lib/log';

const parseOptions = {
	options: {
		input: {
			type: 'string',
			short: 'i',
		},
	},
	strict: true,
} as const;

async function run(): Promise<void> {
	const { values } = parseArgs(parseOptions);

	if (!values.input) {
		throw new Error('--input is required');
	}

	logger.info({ input: values.input }, 'starting');
}

run().catch((error: unknown) => {
	logger.error({ err: error }, 'script failed');
	process.exit(1);
});
```

Use `console.log` for the script's intended output. Use `logger` for progress and diagnostics.

## Code Organization

Use `app/` for Next.js routes and UI entrypoints. Use `lib/` for shared implementation. Use `scripts/` for CLI entrypoints that wire together library code.

```text
project/
├── app/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── ai/
│   ├── config/
│   ├── db/
│   ├── errors.ts
│   ├── log.ts
│   └── retry.ts
├── prompts/
└── scripts/
```

Keep files focused. Avoid `utils`, `helpers`, and broad catch-all modules.

Prefer direct, manual wiring over hidden registries or global service containers.

### Common Agent Anti-Patterns

Avoid these habits. They usually make TypeScript code look busy without making it safer.

- Creating a class for one function and no state.
- Extracting a helper after one use just to make a file look organized.
- Naming every small inline object even when the name adds no meaning.
- Building `utils.ts`, `helpers.ts`, or `types.ts` dumping grounds.
- Wrapping SDKs so thoroughly that the underlying library docs no longer help.
- Using `reduce` or nested array chains where a loop would read top to bottom.
- Adding fallback behavior for impossible states instead of enforcing the invariant.
- Preserving compatibility with code that only exists on the current branch.

## Tests

Test behavior, not implementation shape. Add focused tests for shared helpers, validation logic, error paths, and anything that protects a public contract.

```typescript
it('rejects invalid concurrency before running tasks', async () => {
	const mapper = vi.fn().mockResolvedValue(1);

	await expect(mapConcurrent([1], mapper, { concurrency: 0 })).rejects.toThrow(
		'concurrency must be a positive integer'
	);
	expect(mapper).not.toHaveBeenCalled();
});
```

Prefer small fixtures inside tests. Avoid new example files or broad snapshots unless they are the clearest way to protect behavior.

Use fake timers or injected dependencies when testing time, retries, or randomness would otherwise make tests slow or flaky.

## Dependency Management

Use `pnpm add package-name` for runtime dependencies and `pnpm add -D package-name` for dev dependencies.

Before adding a dependency, check whether the platform or existing stack already provides the feature. Prefer small, well-maintained packages for focused problems.

Keep dependency updates intentional. Do not run broad upgrades unless explicitly asked.

## Comments

Comment non-obvious intent, invariants, operational behavior, or surprising tradeoffs. Do not narrate code that already reads clearly.

```typescript
// cache prompts outside development so request handlers don't hit the disk on every call.
const shouldCache = env.NODE_ENV !== NodeEnv.DEVELOPMENT;
```

Avoid section-banner comments. Use files and functions for structure.

## Generated and Local Files

Keep generated build output out of Git and Docker contexts. Keep project-specific agent assets, such as `.agents/`, in the project when they are part of the development workflow, but exclude them from Docker images unless runtime code needs them.

Agent skill/reference assets are project inputs, but they may include vendor Markdown or lock files. It is fine to exclude those from project-wide formatting when formatting churn would obscure useful changes.

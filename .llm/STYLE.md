# TypeScript Style Guide

Project-specific TypeScript style guide for AI-first Next.js projects. Favor idiomatic TypeScript, React, and Next.js over clever abstractions.

**Minimum TypeScript version**: 5.0+ (uses `satisfies`, `const` type parameters, modern strict settings).
**Runtime**: Node.js 24+ (uses `node:util` `parseArgs`, native `fetch`, `AbortController`, private class fields).
**Package manager**: pnpm. Use `pnpm dlx` for one-off commands. Never `npm`, `npx`, or `yarn`.

## Philosophy

Write boring code. Prefer explicit over implicit. Optimize for reading, not writing. Let TypeScript, ESLint, Prettier, and framework conventions do their jobs. Add abstractions only when they remove real complexity. Every abstraction must earn its place — if a plain function works, don't wrap it in a class.

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
pnpm format:check            # check formatting without writing
pnpm typecheck               # Next route types + TypeScript (no emit)
pnpm test                    # run Vitest
pnpm check                   # local verification bundle (typecheck + lint + test)
pnpm db:generate             # generate Drizzle migrations
pnpm db:migrate              # apply Drizzle migrations
pnpm db:studio               # open Drizzle Studio
pnpm script scripts/foo.ts   # run a CLI script with env loading
```

## Imports

Four groups, blank line between each: node built-ins (`node:` prefix), external packages, internal modules (path alias), relative imports. Use `import type` for type-only imports.

```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateText, Output } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/log';

import { processDocument } from './process-document';
import type { DocumentResult } from './process-document';

import './side-effects'; // side-effect imports last with a comment explaining why
```

Node built-ins go first because they're stable, never tree-shaken, and visually distinct via the `node:` prefix. The blank line is small but makes the boundary explicit.

**`import type` vs regular imports.** Use `import type` for types and interfaces (erased at compile time). Regular imports for runtime values. Benefits: smaller bundles, avoids circular dependencies, clearer intent.

Side-effect imports should be rare. When needed, keep them visibly separate and comment why the import exists.

## Naming

Use normal TypeScript naming. Do not contort names to match a pattern — a name that clearly describes the local concept wins.

| Category          | Convention             | Examples                                         |
| ----------------- | ---------------------- | ------------------------------------------------ |
| Functions/methods | camelCase              | `getUser`, `processItems`                        |
| Variables         | camelCase              | `userId`, `isActive`                             |
| Booleans          | `is/has/should/can`    | `isActive`, `hasPermission`, `shouldRetry`       |
| Types/interfaces  | PascalCase             | `UserConfig`, `ApiResponse`                      |
| Classes           | PascalCase             | `RateLimiter`, `HttpClient`                      |
| Constants (local) | camelCase              | `defaultTimeout`, `maxRetries`                   |
| Module constants  | SCREAMING_SNAKE        | `MAX_RETRIES`, `DEFAULT_TIMEOUT`                 |
| Const obj (name)  | PascalCase             | `Status`, `PriorityLevel`, `NodeEnv`             |
| Const obj (keys)  | SCREAMING_SNAKE        | `Status.PENDING`, `Status.ACTIVE`                |
| Zod schemas       | camelCase              | `userSchema`, `createUserSchema`                 |
| Files             | kebab-case             | `user-service.ts`, `http-client.ts`              |
| Type parameters   | Single char or `TName` | `T`, `K`, `V` or descriptive `TInput`, `TOutput` |

**Boolean names** should read as yes/no questions:

```typescript
// GOOD: reads as a question
const isValid = schema.safeParse(data).success;
const hasChildren = node.children.length > 0;
function shouldRetry(attempt: number, error: Error): boolean {
	/* ... */
}

// BAD: ambiguous
const valid = schema.safeParse(data).success;
const children = node.children.length > 0;
```

## Modules and Exports

**Inline named exports.** Export at the declaration site, not at the bottom of the file. The export travels with the code, so intent is visible immediately.

```typescript
// GOOD
export const MAX_RETRIES = 3;

export type UserConfig = {
	timeout: number;
	retries: number;
};

export function getUser(id: string): Promise<User> {
	return db.query.users.findFirst({ where: eq(users.id, id) });
}

// BAD: bottom-of-file export list
const MAX_RETRIES = 3;
function getUser(id: string): Promise<User> {
	/* ... */
}
export { MAX_RETRIES, getUser };
```

**Named exports over default exports.** Named exports are grep-friendly, refactor-safe, and give consistent names across the codebase. Default exports are fine when a framework expects them: Next.js pages, layouts, error boundaries, route handler types that require it.

**`export type` for type-only exports.** Mirrors `import type`.

```typescript
export type UserId = Brand<string, 'UserId'>;
export type ApiResponse = {
	data: unknown;
	status: number;
};
```

**No re-export barrel files.** Do not create `index.ts` files whose only purpose is to re-export from siblings. Import directly from the module that owns the code. Re-export barrels obscure ownership, create circular dependency traps, and hurt tree-shaking.

```typescript
// BAD: importing from a re-export barrel
import { logger, env, retry } from '@/lib';

// GOOD: import from source
import { logger } from '@/lib/log';
import { env } from '@/lib/config/env';
import { retry } from '@/lib/retry';
```

An `index.ts` is fine when it is a real implementation module. The problem is re-export barrels, not the filename.

**Server-only vs client-safe modules.** Keep them separate:

- Server-only modules may read env vars, secrets, the filesystem, or database clients.
- Client components must not import server-only modules.
- Shared pure helpers should not import server-only state.

## Variables

`const` by default. `let` only when reassignment is needed. Never `var`.

```typescript
// GOOD
const maxRetries = 3;
const users = await fetchUsers(); // const binds the reference, not the value

let attempt = 0;
while (attempt < maxRetries) {
	attempt += 1;
}

// BAD
var timeout = 5000;
let baseUrl = 'https://api.example.com'; // never reassigned — use const
```

## Strings

Use template literals for building strings. Never use string concatenation (`+`) unless building strings incrementally in a loop.

```typescript
// GOOD
const greeting = `hello, ${name}!`;
const url = `${baseUrl}/users/${userId}/posts`;

// BAD
const greeting = 'hello, ' + name + '!';

// ACCEPTABLE: concatenation in a loop accumulator
let csv = '';
for (const row of rows) {
	csv += row.join(',') + '\n';
}
```

## Formatting

Let Prettier format code. Do not manually reshape code around arbitrary line breaks.

**Inline small objects when that is clearer:**

```typescript
return Response.json({ status: 'error' }, { status: 503 });
```

**Use multi-line objects for semantic records, nested options, and arrays of objects.** This applies to AI SDK messages, Drizzle column definitions, route payloads with multiple fields, and provider options.

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

**Name values when the name explains intent**, the value is reused, or the inline expression becomes noisy. Do not name a value just to satisfy a rule:

```typescript
const retryOptions = {
	maxAttempts: retries + 1,
	signal: generateParams.abortSignal,
};

return retry(runGeneration, retryOptions);
```

**Use blank lines to separate logical groups** inside a function body. A `return` statement should have a preceding blank line. Closely related statements stay together.

```typescript
// GOOD: grouped by intent
async function processItems(items: readonly Item[]): Promise<number> {
	const validated = items.filter(item => item.isValid);

	const results = await Promise.all(validated.map(item => transform(item)));

	const total = results.reduce((sum, r) => sum + r.value, 0);

	if (total === 0) {
		throw new ValidationError('no valid items to process');
	}

	return total;
}
```

## Functions and Control Flow

### Declarations vs Arrows

Use `function` declarations for top-level and exported functions. Use arrow functions for callbacks and inline expressions. Use method shorthand in objects.

```typescript
// GOOD: function declaration for top-level / exported
export function createUser(input: CreateUserInput): Promise<User> {
	// ...
}

// GOOD: arrow for callbacks
const activeUsers = users.filter(user => user.isActive);

// GOOD: method shorthand in objects
const userRepository = {
	async findById(id: string) {
		return db.query.users.findFirst({ where: eq(users.id, id) });
	},
};

// BAD: arrow for top-level (no hoisting, anonymous in stack traces)
export const createUser = async (input: CreateUserInput): Promise<User> => {
	// ...
};
```

`function` declarations are hoisted, show the function name in stack traces, and stand out as top-level units. Arrows are concise and capture `this` lexically — ideal for callbacks.

### Explicit Return Types

Write explicit return types on exported functions; they document the contract. Internal helpers can rely on inference when it is obvious.

```typescript
// GOOD: explicit on exports
export function getUser(id: string): Promise<User> {
	return db.query.users.findFirst({ where: eq(users.id, id) });
}

// GOOD: omit on internal helpers
function buildWhereClause(filters: Filters) {
	return {
		...(filters.status && { status: filters.status }),
		...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
	};
}

// GOOD: omit on simple callbacks
const names = users.map(user => user.name);
```

Do not mark a function `async` unless it awaits or intentionally returns a promise from an async API.

### Guard Clauses

Handle invalid cases first and return/throw early. This eliminates nesting and keeps the main logic at the top indentation level.

```typescript
// BAD: nested conditionals
async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
	const user = await db.query.users.findFirst({ where: eq(users.id, id) });
	if (user) {
		if (user.isActive) {
			return db.update(users).set(input).where(eq(users.id, id)).returning();
		} else {
			throw new ForbiddenError(`user ${id} is deactivated`);
		}
	} else {
		throw new NotFoundError(`user ${id}`);
	}
}

// GOOD: guard clauses, flat structure
async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
	const user = await db.query.users.findFirst({ where: eq(users.id, id) });

	if (!user) {
		throw new NotFoundError(`user ${id}`);
	}

	if (!user.isActive) {
		throw new ForbiddenError(`user ${id} is deactivated`);
	}

	return db.update(users).set(input).where(eq(users.id, id)).returning();
}
```

Always use blocks for `if` statements — no braceless one-liners.

### Ternaries

Use ternaries for simple, single-condition expressions. Never nest them.

```typescript
// GOOD
const label = isActive ? 'enabled' : 'disabled';

// BAD
const label = isAdmin ? 'admin' : isModerator ? 'moderator' : 'user';

// GOOD: extract to a function or switch
function getRoleLabel(user: User): string {
	if (user.isAdmin) return 'admin';
	if (user.isModerator) return 'moderator';

	return 'user';
}
```

### Async/Await

Always use async/await over raw Promise chains.

```typescript
// BAD: Promise chains
function getUser(id: string) {
	return db.query.users.findFirst({ where: eq(users.id, id) }).then(user => {
		if (!user) throw new NotFoundError('user');
		return user;
	});
}

// GOOD: async/await
async function getUser(id: string): Promise<User> {
	const user = await db.query.users.findFirst({ where: eq(users.id, id) });

	if (!user) {
		throw new NotFoundError('user');
	}

	return user;
}
```

## API Design

Design exported functions around the caller. Keep the call site readable.

**Use positional arguments for one or two obvious required values. Use an options object** when there are optional settings, booleans, callbacks, or more than two parameters.

```typescript
// GOOD: required value + optional behavior
export function loadPrompt(name: string, vars: PromptVars = {}): string {
	// ...
}

// GOOD: options object self-documents the call site
export async function retry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	// ...
}

await retry(fetchDocument, {
	maxAttempts: 3,
	signal,
});
```

**Avoid boolean parameters in public APIs.** They make call sites cryptic.

```typescript
// BAD: what does true mean?
await generateSummary(document, true);

// GOOD: caller names the behavior
await generateSummary(document, { includeKeyPoints: true });
```

**Return concrete values.** Do not wrap everything in a custom `Result` type unless the codebase has committed to that pattern. In TypeScript application code, throwing at internal layers and handling at boundaries is usually clearer.

**Use generics when they preserve information for the caller.** Avoid generics that only make implementation code look abstract.

```typescript
// GOOD: schema determines the return type
export async function structured<T extends z.ZodType>(schema: T, options: StructuredOptions): Promise<z.infer<T>> {
	// ...
}

// BAD: generic with no useful constraint or caller benefit
function process<T>(value: T): T {
	return value;
}
```

**Name callback parameters after their role** when the function is exported or reused. `callback` is acceptable when the role is literally a callback. `fn` is fine in tiny local helpers, but names like `operation`, `mapper`, `predicate`, `loader`, or `task` usually read better at API boundaries.

## Collection Transformations

Use `map`, `filter`, and `reduce` when the transformation is short and obvious. Use `for...of` when the work has branching, async operations, multiple outputs, logging, error handling, or named intermediate steps.

```typescript
// GOOD: obvious one-step transformation
const titles = documents.map(document => document.title);

// GOOD: loop makes branching and side effects visible
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

## Abstractions and Classes

Prefer plain functions and modules. Add classes only when you need stateful instances with multiple methods that share private state.

```typescript
// GOOD: module-level function for stateless behavior
export function schemaBlock(schema: z.ZodType): string {
	return `\`\`\`json\n${JSON.stringify(toJSONSchema(schema), null, 2)}\n\`\`\``;
}

// GOOD: class when the instance owns shared state and behavior
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

// GOOD: class when several methods share a connection pool
export class DatabasePool {
	readonly #pool: Pool;

	constructor(connectionString: string) {
		this.#pool = new Pool(connectionString);
	}

	async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
		/* ... */
	}
	async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
		/* ... */
	}
	async close(): Promise<void> {
		/* ... */
	}
}

// BAD: class for what should be a function
class UserValidator {
	validate(input: unknown): User {
		return userSchema.parse(input);
	}
}
// just use: const user = userSchema.parse(input)
```

Use `#`-prefixed private fields for true privacy, not `private` (which is only enforced at compile time).

Avoid manager/service classes that only group unrelated functions. A file with named exports is simpler until shared state or a stable public object model appears.

Do not introduce interfaces before there is a second implementation or a useful test seam. Accepting a tiny structural type at the consumer can be clearer than exporting a broad abstraction from the producer.

## Type Safety

### Order of Preference

Fully typed → Generics with constraints → Semi-typed (`Record<string, KnownType>`) → `unknown` with narrowing → `any` (last resort, requires justification).

```typescript
// BAD: any everywhere
function findItem(items: any[], id: string): any {
	return items.find(item => item.id === id);
}

// GOOD: generic with constraint
type Identifiable = { id: string };

function findItem<T extends Identifiable>(items: T[], id: string): T | undefined {
	return items.find(item => item.id === id);
}

// GOOD: multiple constraints
type Timestamped = { createdAt: Date };

function sortByCreation<T extends Identifiable & Timestamped>(items: T[]): T[] {
	return [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// GOOD: unknown forces validation before use
function readPayload(value: unknown): Payload {
	return payloadSchema.parse(value);
}
```

### Avoid Non-null Assertion (`!`)

The `!` operator silences the type checker without adding runtime safety. Prefer narrowing, optional chaining, or an explicit throw.

```typescript
// BAD
const name = user!.name;
const first = items.find(i => i.isActive)!;

// GOOD: narrow with a check
if (!user) {
	throw new NotFoundError('user');
}
const name = user.name;

// GOOD: optional chaining when null is acceptable
const name = user?.name ?? 'anonymous';
```

The only acceptable use is in test code where a preceding assertion guarantees the value exists.

### Interface vs Type

Prefer `type` for data shapes, unions, and function signatures. Use `interface` only when declaration merging or class implementation contracts are useful.

```typescript
type User = {
	id: string;
	name: string;
	email: string;
};

type Status = 'pending' | 'active' | 'completed';
type Handler = (request: Request) => Promise<Response>;

interface Repository<T> {
	findById(id: string): Promise<T | null>;
	save(item: T): Promise<void>;
}
```

### `satisfies`

Use `satisfies` to validate a value matches a type while preserving its literal type. Combine with `as const` for deeply-immutable shapes.

```typescript
// BAD: type annotation widens literals
const config: Record<string, string> = {
	apiUrl: 'https://api.example.com',
	env: 'production',
};
config.typo; // no error — Record allows any string key

// GOOD: satisfies validates AND preserves literals
const config = {
	apiUrl: 'https://api.example.com',
	env: 'production',
} satisfies Record<string, string>;

config.apiUrl; // type: "https://api.example.com" (literal preserved)
config.typo; // error: property 'typo' does not exist

// GOOD: as const satisfies for nested literal preservation
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

### Type Guards and Predicates

Use type predicates (`is`) to narrow types in conditional checks.

```typescript
function isUser(value: unknown): value is User {
	return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

const mixed: (string | number)[] = [1, 'two', 3, 'four'];
const strings = mixed.filter((x): x is string => typeof x === 'string');

function assertIsUser(value: unknown): asserts value is User {
	if (!isUser(value)) {
		throw new Error('expected user');
	}
}
```

### Exhaustive Switch

Use the `never` trick to make the compiler catch unhandled cases. If a new variant is added later, every switch that missed it becomes a compile error.

```typescript
const Status = {
	PENDING: 'pending',
	ACTIVE: 'active',
	COMPLETED: 'completed',
} as const;

type Status = (typeof Status)[keyof typeof Status];

function getStatusLabel(status: Status): string {
	switch (status) {
		case Status.PENDING:
			return 'waiting';
		case Status.ACTIVE:
			return 'running';
		case Status.COMPLETED:
			return 'done';
		default: {
			const _exhaustive: never = status;
			throw new Error(`unhandled status: ${_exhaustive}`);
		}
	}
}
```

### Branded Types (Nominal Typing)

Prevent mixing up values that share the same base type.

```typescript
type Brand<T, B> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

function UserId(id: string): UserId {
	return id as UserId;
}

function PostId(id: string): PostId {
	return id as PostId;
}

function getUser(userId: UserId): Promise<User> {
	/* ... */
}

const userId = UserId('user-123');
const postId = PostId('post-456');

getUser(userId); // ok
getUser(postId); // error: PostId not assignable to UserId
```

### Null vs Undefined

`undefined` is for structural absence (optional properties, `Map.get` misses, `Array.find` failures). `null` is for intentional "no value" chosen by the developer.

```typescript
// undefined: structural absence
type User = {
	id: string;
	nickname?: string; // string | undefined
};

function findUser(id: string): User | undefined {
	/* ... */
}

// null: intentional "no value"
type Form = {
	selectedUser: User | null;
};

const [data, setData] = useState<User | null>(null); // not yet loaded

// Nullish coalescing (??) vs OR (||)
const count = input ?? 0; // only null/undefined trigger fallback
const count2 = input || 0; // 0, "", false also trigger (usually wrong)
```

### Readonly and Immutability

Prefer immutable data. Use `readonly` for arrays and properties that shouldn't change.

```typescript
type User = {
	readonly id: string;
	readonly createdAt: Date;
	name: string; // mutable
};

function processItems(items: readonly string[]) {
	items.push('new'); // error: push doesn't exist on readonly array
	return [...items, 'new'];
}

const config = {
	api: {
		url: 'https://api.example.com',
		timeout: 5000,
	},
	features: ['auth', 'logging'],
} as const;
```

## Constants and Enums

Use const objects with `as const`. Avoid TypeScript `enum`.

```typescript
// PREFERRED: const object (SCREAMING_SNAKE keys)
export const Status = {
	PENDING: 'pending',
	ACTIVE: 'active',
	COMPLETED: 'completed',
} as const;

export type Status = (typeof Status)[keyof typeof Status];

function processStatus(status: Status) {
	if (status === Status.PENDING) {
		// ...
	}
}

// AVOID: TypeScript enum
// enum Status { Pending, Active, Completed } // DON'T DO THIS

// ACCEPTABLE: string literal union for simple, ad-hoc cases
type Priority = 'low' | 'medium' | 'high';
```

Use a const object when the value is serialized, logged, or shared across boundaries. Use a string literal union when it is purely a local discriminator.

## Zod and Validation

Validate untrusted data with Zod. Define the schema first, infer the TypeScript type. Keep schemas near the code that owns the data shape.

**Note:** This project uses Zod v4. `z.nativeEnum()` is deprecated; use `z.enum()` instead.

### Schema-First Design

```typescript
import { z } from 'zod';

const userSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	email: z.string().email(),
	role: z.enum(['admin', 'user']),
	createdAt: z.date(),
});

type User = z.infer<typeof userSchema>;

// Derived schemas
const createUserSchema = userSchema.omit({
	id: true,
	createdAt: true,
});
type CreateUserInput = z.infer<typeof createUserSchema>;

const updateUserSchema = createUserSchema.partial();
type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

### Parse vs SafeParse

Use `parse` at boundaries where invalid data should throw and be handled by the boundary. Use `safeParse` when the local function can recover or return a typed error.

```typescript
// throws ZodError on invalid data
function processItem(data: unknown): Item {
	return itemSchema.parse(data);
}

// returns a result object instead of throwing
function safeProcessItem(data: unknown): Item | null {
	const result = itemSchema.safeParse(data);

	return result.success ? result.data : null;
}
```

### Schemas for AI Structured Output

When schemas are used with the AI SDK's `Output.object()`, add `.meta()` with descriptions for every field. The model uses these descriptions to understand what to generate.

```typescript
const extractedEntitySchema = z
	.object({
		name: z.string().meta({ description: 'the canonical name of the entity' }),
		type: z.enum(['person', 'organization', 'location']).meta({
			description: 'the entity type',
		}),
		confidence: z.number().min(0).max(1).meta({
			description: 'extraction confidence between 0 and 1',
		}),
	})
	.meta({
		title: 'ExtractedEntity',
		description: 'a named entity extracted from text',
		strict: true,
	});

type ExtractedEntity = z.infer<typeof extractedEntitySchema>;
```

## Errors

Throw errors with useful context. Log at boundaries — route handlers, server actions, CLI entrypoints, background workers. Handle an error or propagate it; never both.

```typescript
// BAD: logs and throws — caller will likely log again
try {
	return await fetchData(id);
} catch (error) {
	logger.error({ err: error }, 'failed to fetch data');
	throw error;
}

// GOOD: propagate, let the boundary decide
return await fetchData(id);
```

Error messages: lowercase, no trailing punctuation, add context.

### Programmer Errors vs Operational Errors

TypeScript has `throw`, not panics, but the distinction still matters.

**Programmer errors** are violated invariants: impossible states, invalid options, missing required configuration, an unreachable branch. Throw immediately — continuing would hide a bug.

```typescript
function assertPositiveInteger(value: number, name: string): void {
	if (!Number.isInteger(value) || value < 1) {
		throw new Error(`${name} must be a positive integer`);
	}
}
```

**Operational errors** are expected failures from the world: network errors, invalid user input, missing rows, rejected model calls. Add context and let the boundary decide how to report them.

```typescript
async function requireDocument(id: string): Promise<Document> {
	const document = await findDocument(id);

	if (!document) {
		throw new NotFoundError(`document ${id}`);
	}

	return document;
}
```

### Custom Error Classes

For expected domain errors that callers need to branch on. Check with `instanceof`.

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

export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`${resource} not found`, 'NOT_FOUND', 404);
	}
}

export class ValidationError extends AppError {
	constructor(message: string, field?: string) {
		super(message, 'VALIDATION_ERROR', 400);
	}
}
```

### Boundary Handling

```typescript
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
	try {
		const { id } = await params;
		const user = await getUser(id);

		return Response.json(user);
	} catch (error) {
		if (error instanceof NotFoundError) {
			return Response.json({ error: error.message }, { status: 404 });
		}

		logger.error({ err: error }, 'get user failed');

		return Response.json({ error: 'internal error' }, { status: 500 });
	}
}
```

## Async and Concurrency

Use `Promise.all` for independent work that must all succeed. Use `Promise.allSettled` when partial failure is expected.

```typescript
// all must succeed
const [user, posts, followers] = await Promise.all([getUser(userId), getUserPosts(userId), getUserFollowers(userId)]);

// partial failure ok
const [userResult, postsResult] = await Promise.allSettled([getUser(userId), getUserPosts(userId)]);
```

### Bounded Concurrency

For large batches or rate-limited services, use a sliding-window limiter such as `p-limit` over chunked batches. Chunked batching wastes time on the slowest item per chunk; `p-limit` keeps all slots busy.

```typescript
import pLimit from 'p-limit';

// BAD: chunked batching — slow items block the chunk
for (let i = 0; i < items.length; i += 10) {
	const chunk = items.slice(i, i + 10);
	await Promise.all(chunk.map(processItem));
}

// GOOD: p-limit — starts next item as soon as a slot opens
const limit = pLimit(10);
const results = await Promise.all(items.map(item => limit(() => processItem(item))));
```

### Promise Formatting

Prefer naming task arrays before awaiting. This makes concurrency visible, gives the mapped work a name, and keeps `Promise.all` from becoming a nested expression. Inline `Promise.all(items.map(...))` is fine for tiny one-line mappings.

```typescript
// GOOD: the concurrent work has a name
const userTasks = userIds.map(userId => getUser(userId));
const users = await Promise.all(userTasks);

// GOOD: named tasks read better once the body grows
const generationTasks = documents.map(document =>
	limit(async () => {
		const prompt = loadPrompt('summarize', { TITLE: document.title });
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

Prefer `for...of` when tasks must run sequentially or each step depends on the previous result. Do not use `Promise.all` just because it looks concise; use it because concurrency is correct.

### Cancellation with AbortSignal

Accept `AbortSignal` for long-running operations. Check the signal before starting work and pass it to APIs that support cancellation.

```typescript
export async function retry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	options.signal?.throwIfAborted();

	return operation();
}
```

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

CLI scripts that may run long should handle `SIGINT` and `SIGTERM`. Thread an `AbortSignal` through the work instead of using global flags.

## Environment and Configuration

Centralize runtime configuration in `lib/config/env.ts`. Validate environment variables once at startup and import typed config from there.

```typescript
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	DATABASE_URL: z.url(),
	OPENROUTER_API_KEY: z.string().min(1),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

```typescript
// GOOD
import { env } from '@/lib/config/env';
const pool = createPool(env.DATABASE_URL);

// BAD
const pool = createPool(process.env.DATABASE_URL!);
```

Config files that run outside Next.js, such as `drizzle.config.ts`, may read `process.env` directly when importing the full env module would require unrelated secrets.

Use `SKIP_ENV_VALIDATION=true` only for build-time or CI paths that should not require runtime secrets.

## Logging

Use Pino for structured JSON logging. Pretty-print in development only.

```typescript
// lib/log.ts
import pino from 'pino';

import { env } from '@/lib/config/env';

export const logger = pino({
	level: env.LOG_LEVEL,
	...(env.NODE_ENV === 'development' && {
		transport: { target: 'pino-pretty' },
	}),
});
```

Pino's API puts the data object first, message string second. Messages are lowercase and stable — put dynamic values in structured fields, not in the message.

```typescript
import { logger } from '@/lib/log';

// GOOD
logger.info({ port: 3000 }, 'server starting');
logger.error({ err, userId: '123' }, 'failed to process user');
logger.info('migration complete');

// child loggers for scoped context
const log = logger.child({
	module: 'ai',
	script: 'process-document',
});
log.info({ model: 'gpt-5', tokens: 1523 }, 'generation complete');

// BAD: uppercase, string interpolation, console.log
console.log(`Starting server on port ${port}`);
logger.info(`User ${userId} created successfully`);
```

Use `console.log` only for intentional CLI output. Use `logger` for diagnostics.

Client-only error boundaries cannot use the server logger. Use `console.error` there for render diagnostics, and keep the message stable.

## Database (Drizzle)

### Schema Definition

```typescript
// lib/db/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Connection Setup

```typescript
// lib/db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from '@/lib/config/env';
import * as schema from '@/lib/db/schema';

export const db = drizzle(env.DATABASE_URL, { schema });
```

### Query Patterns

```typescript
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

const user = await db.query.users.findFirst({
	where: eq(users.id, userId),
});

const [newUser] = await db
	.insert(users)
	.values({
		name: 'alice',
		email: 'alice@example.com',
	})
	.returning();

await db.update(users).set({ name: 'updated' }).where(eq(users.id, userId));

await db.delete(users).where(eq(users.id, userId));
```

### Transactions

```typescript
const result = await db.transaction(async tx => {
	const [user] = await tx.insert(users).values(input).returning();

	await tx.insert(userSettings).values({
		userId: user.id,
		theme: 'light',
	});

	return user;
});
```

Generate migrations for schema changes. Use `db:push` only for local development when migrations are intentionally skipped. Do not hide Drizzle queries behind generic repository abstractions unless there is real domain behavior to encapsulate.

## AI SDK and Prompts

### Provider Setup

One provider, one file, one export. Provider option presets for common configurations.

```typescript
// lib/ai/provider.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { env } from '@/lib/config/env';

export const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
});

export const providerOptions = {
	reasoningOff: {
		openrouter: {
			reasoning: {
				enabled: false,
				exclude: false,
				effort: 'none',
			},
		},
	},
	reasoningLow: {
		openrouter: {
			reasoning: {
				enabled: true,
				exclude: true,
				effort: 'low',
			},
		},
	},
	reasoningHigh: {
		openrouter: {
			reasoning: {
				enabled: true,
				exclude: true,
				effort: 'high',
			},
		},
	},
} as const;
```

Model selection happens at the call site. The provider gives you the model instance, not the other way around.

```typescript
// GOOD: caller picks the model
const result = await structured(schema, {
	model: openrouter('google/gemini-3-flash-preview'),
	system: loadPrompt('extract-entities'),
	messages,
});

// BAD: model constants baked into the template
import { FAST_MODEL } from '@/lib/ai/models'; // don't do this
```

### Structured Output

Use `generateText` with `Output.object()` for type-safe structured output. The `structured()` wrapper enforces the pattern, handles the null-output guard, and centralizes retries.

```typescript
// lib/ai/structured.ts
import { type LanguageModel, generateText, Output } from 'ai';
import type { z } from 'zod';

import { retry } from '@/lib/retry';

type StructuredOptions = {
	model: LanguageModel;
	system?: string;
	messages: Array<{
		role: 'user' | 'assistant';
		content: string;
	}>;
	providerOptions?: Record<string, unknown>;
	retries?: number;
};

export async function structured<T extends z.ZodType>(schema: T, options: StructuredOptions): Promise<z.infer<T>> {
	const { retries = 2, ...rest } = options;

	return retry(
		async () => {
			const { output } = await generateText({
				...rest,
				output: Output.object({
					schema,
					name: schema.meta()?.title,
					description: schema.meta()?.description,
				}),
			});

			if (!output) {
				throw new Error('model returned no structured output');
			}

			return output as z.infer<T>;
		},
		{ maxAttempts: retries + 1 }
	);
}
```

A wrapper is useful when it centralizes validation, retries, logging, or provider-specific defaults. A wrapper that only renames an SDK function adds indirection without buying much.

```typescript
// GOOD: wrapper adds typing, retry, and the null-output guard
const summary = await structured(summarySchema, {
	model: openrouter(modelId),
	system,
	messages,
});

// BAD: wrapper only hides the SDK call and invents a second API
const summary = await aiService.generateStructuredSummary(document);
```

### Streaming

```typescript
// app/api/chat/route.ts
import { streamText, isStepCount } from 'ai';

import { openrouter } from '@/lib/ai/provider';
import { loadPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request): Promise<Response> {
	const { messages } = await request.json();

	const result = streamText({
		model: openrouter('google/gemini-3-flash-preview'),
		system: loadPrompt('chat'),
		messages,
		stopWhen: isStepCount(5),
	});

	return result.toUIMessageStreamResponse();
}
```

### Tool Definitions

Define tools with `inputSchema` (not the deprecated `parameters`).

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const searchDocuments = tool({
	description: 'search the document database for relevant content',
	inputSchema: z.object({
		query: z.string().describe('the search query'),
		limit: z.number().int().min(1).max(20).default(5).describe('max results'),
	}),
	execute: async ({ query, limit }) => {
		const results = await db.query.documents.findMany({
			where: ilike(documents.content, `%${query}%`),
			limit,
		});

		return results.map(r => ({
			id: r.id,
			excerpt: r.content.slice(0, 200),
		}));
	},
});
```

### Agents

Use `ToolLoopAgent` for multi-step AI agents.

```typescript
import { ToolLoopAgent } from 'ai';

import { openrouter } from '@/lib/ai/provider';
import { searchDocuments } from '@/lib/tools/search-documents';
import { createNote } from '@/lib/tools/create-note';

export const researchAgent = new ToolLoopAgent({
	model: openrouter('google/gemini-3.1-pro-preview'),
	instructions: 'you are a research assistant. search documents and create notes.',
	tools: {
		searchDocuments,
		createNote,
	},
});
```

### Prompt Files

Prompts live as standalone Markdown files in `prompts/` at the project root. One file per prompt, named by purpose.

```text
prompts/
  extract-entities.md
  classify-sentiment.md
  chat.md
  summarize.md
```

Use `{{DIRECTIVE}}` placeholders for dynamic content injected at load time.

```markdown
# Extract Entities

You are an entity extraction system. Extract all named entities from the
provided text.

## Response Format

Return a JSON object matching this schema:

{{RESPONSE_SCHEMA}}

## Rules

- Extract only entities explicitly mentioned in the text
- Assign confidence based on how clearly the entity is identified
- Use canonical names (e.g., "United States" not "US" or "America")
```

The prompt loader reads from `prompts/`, resolves `{{DIRECTIVE}}` placeholders, and validates that all directives are resolved and no unused variables are passed. Bidirectional validation catches both renamed placeholders and stale variables.

````typescript
// lib/ai/prompts.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { toJSONSchema } from 'zod/v4/core';
import type { z } from 'zod';

const PROMPTS_DIR = join(import.meta.dirname, '../../prompts');
const DIRECTIVE_PATTERN = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

export function loadPrompt(name: string, vars: Record<string, string> = {}): string {
	const filePath = join(PROMPTS_DIR, `${name}.md`);
	let content = readFileSync(filePath, 'utf-8');

	const usedVars = new Set<string>();

	content = content.replace(DIRECTIVE_PATTERN, (match, key: string) => {
		if (!(key in vars)) {
			throw new Error(`unresolved directive {{${key}}} in prompt "${name}"`);
		}

		usedVars.add(key);

		return vars[key];
	});

	const unusedVars = Object.keys(vars).filter(k => !usedVars.has(k));

	if (unusedVars.length > 0) {
		throw new Error(`unused vars passed to prompt "${name}": ${unusedVars.join(', ')}`);
	}

	return content;
}

export function schemaBlock(schema: z.ZodType): string {
	return ['```json', JSON.stringify(toJSONSchema(schema), null, 2), '```'].join('\n');
}
````

**Prompts are not configuration stores.** Keep model IDs, retry counts, persistence decisions, and branching logic in TypeScript where they can be typed and tested. Prompts express model instructions; application code validates, persists, retries, and decides what happens next.

## CLI Scripts

Scripts in `scripts/` run with `tsx`. Every script parses arguments, wires library functions together, logs at the boundary, and exits with a clear status.

```typescript
// scripts/process-document.ts
import { parseArgs } from 'node:util';

import { logger } from '@/lib/log';
import { structured } from '@/lib/ai/structured';
import { openrouter } from '@/lib/ai/provider';
import { loadPrompt, schemaBlock } from '@/lib/ai/prompts';

const parseOptions = {
	options: {
		input: {
			type: 'string',
			short: 'i',
		},
		model: {
			type: 'string',
			short: 'm',
			default: 'google/gemini-3-flash-preview',
		},
		verbose: {
			type: 'boolean',
			short: 'v',
			default: false,
		},
	},
	strict: true,
} as const;

async function run(): Promise<void> {
	const { values } = parseArgs(parseOptions);

	if (!values.input) {
		throw new Error('--input is required');
	}

	const log = logger.child({ script: 'process-document' });

	log.info({ input: values.input, model: values.model }, 'starting');

	// ... main logic using lib/ imports ...

	log.info('done');
}

run().catch((error: unknown) => {
	logger.error({ err: error }, 'script failed');
	process.exit(1);
});
```

### Rules

- Use `node:util` `parseArgs`. No dependency needed.
- Import from `@/lib/` via path aliases. Scripts share libraries with the Next.js app.
- Use `logger.child()` for scoped logging.
- `process.exit(1)` only at the top-level `.catch()`.
- Use `console.log` for the script's intended output. Use `logger` for progress and diagnostics.
- Long-running scripts should handle `SIGINT`/`SIGTERM` via an `AbortController` threaded through library calls.
- Never put business logic in the script file. Import it from `lib/`.

```bash
pnpm tsx scripts/process-document.ts --input ./data/doc.pdf
pnpm tsx scripts/process-document.ts -i ./data/doc.pdf -m openai/gpt-5
```

## Next.js

### Server Components (Default)

Components are server components by default. They can be async, fetch data directly, and access server-only resources.

```typescript
// app/documents/page.tsx
import { db } from '@/lib/db/client'
import { documents } from '@/lib/db/schema'

export default async function DocumentsPage() {
	const docs = await db.query.documents.findMany({
		orderBy: (documents, { desc }) => [desc(documents.createdAt)],
	})

	return (
		<main>
			<h1>documents</h1>
			{docs.map((doc) => (
				<article key={doc.id}>{doc.title}</article>
			))}
		</main>
	)
}
```

### Client Components

Add `'use client'` only when you need browser APIs, event handlers, or React hooks. Push it as far down the tree as practical — keep pages and layouts as server components.

```typescript
// components/search-input.tsx
'use client'

import { useState } from 'react'

export function SearchInput({ onSearch }: { onSearch: (query: string) => void }) {
	const [query, setQuery] = useState('')

	return (
		<input
			value={query}
			onChange={(event) => setQuery(event.target.value)}
			onKeyDown={(event) => {
				if (event.key === 'Enter') {
					onSearch(query)
				}
			}}
		/>
	)
}
```

### Route Handlers

Route handlers are transport boundaries: validate input, call library code, translate known errors into HTTP responses. Keep business logic in `lib/`.

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

Small responses can stay inline:

```typescript
return Response.json({ status: 'ok' });
```

Avoid hiding simple route behavior behind a generic handler factory. Extract only when multiple routes share real behavior, not just the same shape.

### Data Boundaries

Keep database clients, filesystem access, provider secrets, and prompt loading on the server. Pass plain serializable data into client components. If a client component needs to trigger server work, use a route handler or server action deliberately.

### Error Boundaries

```typescript
// app/error.tsx
'use client'

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<div>
			<h2>something went wrong</h2>
			<button onClick={reset}>try again</button>
		</div>
	)
}
```

## React Components

Keep components small and data flow explicit. Co-locate component-specific helpers and types with the component.

Extract a shared component only when it has a real second caller or the extraction makes the current file easier to understand.

Prefer server components for data fetching. Use client components for interaction.

## Project Structure

```text
project/
  app/                          Next.js App Router
    layout.tsx
    page.tsx
    error.tsx
    api/
      health/
        route.ts
  components/                   React components
  lib/                          shared libraries — the core
    ai/
      provider.ts               provider init + option presets
      prompts.ts                prompt loader + schemaBlock
      structured.ts             structured output wrapper
      stream.ts                 stream wrapper
    db/
      client.ts                 connection
      schema.ts                 table definitions
      migrations/               generated migrations
    config/
      env.ts                    Zod-validated environment
    log.ts                      pino structured logger
    errors.ts                   application error types
    retry.ts                    exponential backoff with jitter
    concurrency.ts              bounded parallel execution
  prompts/                      markdown prompt templates
    example.md
  scripts/                      CLI scripts (run with tsx)
    example.ts
  .llm/
    STYLE.md                    this file
  .env.example
  drizzle.config.ts
  eslint.config.ts
  next.config.ts
  package.json
  tsconfig.json
  Dockerfile
  compose.yaml
```

### Where Does Code Go?

| You want to...                       | Put it in...         |
| ------------------------------------ | -------------------- |
| Add a web page                       | `app/`               |
| Add an API endpoint                  | `app/api/`           |
| Add a React component                | `components/`        |
| Add shared business logic            | `lib/`               |
| Add AI utilities (provider, prompts) | `lib/ai/`            |
| Add a database table                 | `lib/db/schema.ts`   |
| Add a new prompt template            | `prompts/`           |
| Add a CLI script                     | `scripts/`           |
| Add a new shared utility             | `lib/` (single file) |

### File Organization Rules

- **No re-export barrel `index.ts` files.** Import from the module that owns the code.
- **No `types.ts` files.** Co-locate types with the code that uses them.
- **No `utils/` or `helpers/` dumps.** Every file in `lib/` has a clear, specific purpose.
- **Single-file utilities stay as files.** `lib/retry.ts`, not `lib/retry/index.ts`. Promote to a directory only when it grows.
- **Zod schemas live where they're used.** No central `schemas/` directory.
- **Prefer direct, manual wiring** over hidden registries or global service containers.

## Tests

Test behavior, not implementation shape. Add focused tests for shared helpers, validation logic, error paths, and anything that protects a public contract.

```typescript
import { describe, it, expect, vi } from 'vitest';

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

## Comments

Comment non-obvious intent, invariants, operational behavior, or surprising tradeoffs. Do not narrate code that already reads clearly.

```typescript
// cache prompts outside development so request handlers don't hit the disk on every call.
const shouldCache = env.NODE_ENV !== NodeEnv.DEVELOPMENT;
```

Rules:

- Comment directly above the thing you're documenting.
- Explain _what_ or _why_, not _what section we're in_.
- If code is self-explanatory, don't comment at all.
- Use file/module boundaries to organize code, not comments.

**Never use decorative separators or section banners:**

```typescript
// BAD: section banners
// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

// BAD: other banner styles
// ========================
// Helper functions
// ========================

// ********** Constants **********
```

## Dependency Management

```bash
pnpm add package-name           # runtime dependency
pnpm add -D package-name        # dev dependency
pnpm update --latest            # update all (only when explicitly asked)
```

Before adding a dependency, check whether the platform or existing stack already provides the feature. Prefer small, well-maintained packages for focused problems. Keep dependency updates intentional — do not run broad upgrades unless explicitly asked.

## Common Agent Anti-Patterns

Avoid these habits. They usually make TypeScript code look busy without making it safer.

- Creating a class for one function and no state.
- Extracting a helper after one use just to make a file look organized.
- Naming every small inline object even when the name adds no meaning.
- Building `utils.ts`, `helpers.ts`, or `types.ts` dumping grounds.
- Wrapping SDKs so thoroughly that the underlying library docs no longer help.
- Using `reduce` or nested array chains where a loop would read top to bottom.
- Adding fallback behavior for impossible states instead of enforcing the invariant.
- Preserving compatibility with code that only exists on the current branch.
- Logging and re-throwing in internal layers.
- Reaching for `any` or `!` to make a type error go away.
- Inventing a `Result<T, E>` wrapper when throwing at internal layers and handling at boundaries is clearer.

## Development Workflow

### Type Checking

```bash
pnpm typecheck  # tsc --noEmit — catches type errors without building
```

Use during development, pre-commit hooks, and CI. Faster than a full build.

### Linting and Formatting

```bash
pnpm lint         # eslint
pnpm format       # prettier --write
pnpm format:check # prettier --check
```

### Database Migrations

```bash
pnpm db:generate  # generate migration from schema changes
pnpm db:migrate   # apply pending migrations
pnpm db:push      # push schema directly (dev only)
pnpm db:studio    # open drizzle studio GUI
```

### Running Scripts

```bash
pnpm tsx scripts/example.ts           # run a script
pnpm tsx scripts/example.ts --help    # if the script supports it
```

### Key ESLint Rules

These rules enforce this style guide:

- `@typescript-eslint/no-explicit-any` — prevents `any` usage
- `@typescript-eslint/consistent-type-imports` — enforces `import type`
- `@typescript-eslint/no-unused-vars` — catches dead code
- `@typescript-eslint/prefer-nullish-coalescing` — enforces `??` over `||`
- `@typescript-eslint/no-floating-promises` — catches unhandled async errors
- `@typescript-eslint/no-non-null-assertion` — flags `!` operator usage

## Generated and Local Files

Keep generated build output out of Git and Docker contexts. Keep project-specific agent assets, such as `.agents/`, in the project when they are part of the development workflow, but exclude them from Docker images unless runtime code needs them.

Agent skill/reference assets are project inputs, but they may include vendor Markdown or lock files. It is fine to exclude those from project-wide formatting when formatting churn would obscure useful changes.

# TypeScript Style Guide

Project-specific TypeScript style guide for an AI-first project template. Favor idiomatic TypeScript over clever abstractions.

**Minimum TypeScript version**: 5.0+ (examples use `satisfies`, `const` type parameters, and modern strict settings).
**Runtime**: Node.js 22+ (examples use `node:util` `parseArgs`, native `fetch`, `AbortController`).
**Package manager**: pnpm (never npm or npx; use `pnpm dlx` for one-off commands).

## Philosophy

Write boring code. Prefer explicit over implicit. Optimize for reading, not writing. Keep functions small and focused. Use the type system to prevent bugs at compile time. Every abstraction must earn its place — if a plain function works, don't wrap it in a class.

## Quick Reference

### Tools

```bash
pnpm dev                     # start Next.js dev server
pnpm build                   # production build
pnpm lint                    # lint with eslint
pnpm format                  # format with prettier
pnpm typecheck               # type check without building
pnpm db:generate             # generate drizzle migrations
pnpm db:migrate              # run drizzle migrations
pnpm db:studio               # open drizzle studio
pnpm tsx scripts/example.ts  # run a CLI script
```

### Import Order

Three groups, blank line between each: external packages, internal modules (path alias), relative imports.

```typescript
import { z } from 'zod';
import { generateText, Output } from 'ai';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/log';

import { processDocument } from './process';
import type { DocumentResult } from './process';

import './side-effects'; // side-effect imports last with comment
```

**`import type` vs regular imports:** Use `import type` for types and interfaces (erased at compile time). Regular imports for runtime values. Benefits: smaller bundles, avoids circular dependencies, clearer intent.

### Naming Conventions

| Category          | Convention             | Examples                                         |
| ----------------- | ---------------------- | ------------------------------------------------ |
| Functions/Methods | camelCase              | `getUser`, `processItems`                        |
| Variables         | camelCase              | `userId`, `isActive`                             |
| Booleans          | `is/has/should/can`    | `isActive`, `hasPermission`, `shouldRetry`       |
| Types/Interfaces  | PascalCase             | `UserConfig`, `ApiResponse`                      |
| Classes           | PascalCase             | `UserService`, `HttpClient`                      |
| Constants         | camelCase              | `defaultTimeout`, `maxRetries`                   |
| Module constants  | SCREAMING_SNAKE        | `MAX_RETRIES`, `DEFAULT_TIMEOUT`                 |
| Const obj (name)  | PascalCase             | `Status`, `PriorityLevel`                        |
| Const obj (keys)  | SCREAMING_SNAKE        | `Status.PENDING`, `Status.ACTIVE`                |
| Zod schemas       | camelCase              | `userSchema`, `createUserSchema`                 |
| Files             | kebab-case             | `user-service.ts`, `http-client.ts`              |
| Type parameters   | Single char or `TName` | `T`, `K`, `V` or descriptive `TInput`, `TOutput` |

**Boolean names** should read as yes/no questions. This applies to variables, properties, parameters, and functions that return booleans.

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
function retry(attempt: number, error: Error): boolean {
	/* ... */
}
```

## Exports

**Inline exports.** Export at the declaration site, not at the bottom of the file. The export travels with the code, so intent is visible immediately.

```typescript
// GOOD: inline export
export const MAX_RETRIES = 3;

export type UserConfig = {
	timeout: number;
	retries: number;
};

export function getUser(id: string): Promise<User> {
	const query = { where: eq(users.id, id) };
	return db.query.users.findFirst(query);
}

// BAD: bottom-of-file export list
const MAX_RETRIES = 3;
function getUser(id: string): Promise<User> {
	/* ... */
}
export { MAX_RETRIES, getUser }; // DON'T DO THIS
```

**Named exports over default exports.** Named exports are grep-friendly, refactor-safe, and give consistent names across the codebase. Default exports create ambiguity — the consumer can name the import anything.

```typescript
// GOOD: named export
export function createLogger(name: string): Logger {
	/* ... */
}

// BAD: default export
export default function createLogger(name: string): Logger {
	/* ... */
}
```

The one exception: framework conventions that require default exports (Next.js pages, layout, route handlers). Follow the framework's convention in those cases.

**`export type` for type-only exports.** Mirrors `import type` — erased at compile time, keeps the runtime bundle clean.

```typescript
export type UserId = Brand<string, 'UserId'>;
export type ApiResponse = {
	data: unknown;
	status: number;
};
```

**No barrel files.** Do not create `index.ts` files that re-export from other files. Import directly from source. Barrel files obscure where code lives, create circular dependency traps, and hurt tree-shaking.

```typescript
// BAD: importing from barrel
import { logger, env, retry } from '@/lib';

// GOOD: import from source
import { logger } from '@/lib/log';
import { env } from '@/lib/config/env';
import { retry } from '@/lib/retry';
```

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
var timeout = 5000; // never var
let baseUrl = 'https://api.example.com'; // never reassigned — use const
```

## Comments

Plain comments directly above declarations. No section banners, separators, or decorative markers.

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

```typescript
// GOOD: doc comment above the declaration when clarification is needed
// Validates user input before persistence; strips unknown keys.
const userSchema = z.object({
	/* ... */
});

// Retries with exponential backoff; gives up after the configured max attempts.
async function fetchWithRetry(url: string, options: FetchOptions): Promise<Response> {
	// ...
}
```

Rules:

- Comment directly above the thing you're documenting.
- Explain _what_ or _why_, not _what section we're in_.
- If code is self-explanatory, don't comment at all.
- Never use decorative separators to create visual sections.
- Use file/module boundaries (separate files) to organize code, not comments.

## Functions

### Arrow Functions vs Declarations

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
		const query = { where: eq(users.id, id) };
		return db.query.users.findFirst(query);
	},
};

// BAD: arrow for top-level (no hoisting, anonymous in stack traces)
export const createUser = async (input: CreateUserInput): Promise<User> => {
	// ...
};
```

**Why:** `function` declarations are hoisted, show the function name in stack traces, and stand out visually as top-level units. Arrows are concise and capture `this` lexically, making them ideal for callbacks.

### Explicit Return Types

Write explicit return types on exported functions. Omit them on internal functions where inference is clear.

```typescript
// GOOD: explicit on exports — documents the contract
export function getUser(id: string): Promise<User> {
	const query = { where: eq(users.id, id) };
	return db.query.users.findFirst(query);
}

// GOOD: omit on internal functions where obvious
function buildWhereClause(filters: Filters) {
	return {
		...(filters.status && { status: filters.status }),
		...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
	};
}

// GOOD: omit on simple callbacks
const names = users.map(user => user.name);
```

### Functions Over Classes

Prefer plain functions and closures over classes. Use classes only when you need stateful instances with multiple methods that share private state.

```typescript
// GOOD: plain function — simple, composable, testable
export function createRetry(options: RetryOptions = {}) {
	const maxAttempts = options.maxAttempts ?? 3;
	const baseDelay = options.baseDelay ?? 1000;

	return async function retry<T>(fn: () => Promise<T>): Promise<T> {
		// ...
	};
}

// GOOD: class when multiple methods share state
export class DatabasePool {
	private readonly pool: Pool;

	constructor(connectionString: string) {
		this.pool = new Pool(connectionString);
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

### Options Pattern

For functions or constructors with complex configuration, use an options object with defaults via destructuring or nullish coalescing.

```typescript
type RetryOptions = {
	maxAttempts?: number;
	baseDelay?: number;
	maxDelay?: number;
	multiplier?: number;
};

export function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	const maxAttempts = options.maxAttempts ?? 3;
	const baseDelay = options.baseDelay ?? 1000;
	const maxDelay = options.maxDelay ?? 10_000;
	const multiplier = options.multiplier ?? 2;
	// ...
}

// Usage
const retryOptions = { maxAttempts: 5 };
const result = await retry(() => fetchData(), retryOptions);
```

## Control Flow

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
	const query = { where: eq(users.id, id) };
	const user = await db.query.users.findFirst(query);

	if (!user) {
		throw new NotFoundError(`user ${id}`);
	}

	if (!user.isActive) {
		throw new ForbiddenError(`user ${id} is deactivated`);
	}

	return db.update(users).set(input).where(eq(users.id, id)).returning();
}
```

The pattern: validate preconditions at the top, exit early on failure, then proceed with the happy path unindented. Always use blocks for `if` statements — no braceless one-liners.

### Ternaries

Use ternaries for simple, single-condition expressions. Never nest them.

```typescript
// GOOD: simple ternary
const label = isActive ? 'enabled' : 'disabled';
const timeout = isProduction ? 30_000 : 5_000;

// BAD: nested ternary
const label = isAdmin ? 'admin' : isModerator ? 'moderator' : 'user';

// GOOD: extract to a function
function getRoleLabel(user: User): string {
	if (user.isAdmin) return 'admin';
	if (user.isModerator) return 'moderator';

	return 'user';
}
```

## Strings

### Prefer Template Literals Over Concatenation

Use template literals for building strings. Never use string concatenation (`+`) unless building strings incrementally in a loop.

```typescript
// BAD: concatenation
const greeting = 'hello, ' + name + '!';
const url = baseUrl + '/users/' + userId + '/posts';

// GOOD: template literals
const greeting = `hello, ${name}!`;
const url = `${baseUrl}/users/${userId}/posts`;

// ACCEPTABLE: concatenation in a loop accumulator
let csv = '';
for (const row of rows) {
	csv += row.join(',') + '\n';
}
```

## Object Literals

Use multiline format for objects with two or more properties. Single-property objects may stay on one line. This also applies to type definitions and nested objects.

```typescript
// GOOD: multiline for two or more
const config = {
	timeout: 5000,
	retries: 3,
};

// GOOD: single-property on one line
return { data };
const failure = { cause: error };
throw new AppError('failed', failure);

// BAD: multiple properties on one line
const config = { timeout: 5000, retries: 3 };
```

### Never Pass Inline Objects as Function Arguments

Always assign objects to a named variable before passing them. This makes call sites readable and diffs cleaner.

```typescript
// BAD
await retry(() => fetchData(), { maxAttempts: 5 });

// GOOD
const retryOptions = { maxAttempts: 5 };
await retry(() => fetchData(), retryOptions);
```

## Error Handling

### Basic Pattern

Throw custom errors with context. Let errors propagate — log at the boundary (API route handler, CLI script entry point), not at every layer.

```typescript
async function getUser(id: string): Promise<User> {
	const query = { where: eq(users.id, id) };
	const user = await db.query.users.findFirst(query);

	if (!user) {
		throw new NotFoundError(`user ${id}`);
	}

	return user;
}
```

Handle an error or propagate it; never both. Logging and re-throwing creates duplicate noise up the call chain.

```typescript
// BAD: logs and throws — caller will likely log again
try {
	return await fetchData(id);
} catch (error) {
	logger.error({ err: error }, 'failed to fetch data');
	throw error; // duplicate logging at every layer
}

// GOOD: propagate, let the boundary decide
return await fetchData(id);
```

Error messages: lowercase, no trailing punctuation, add context.

### Custom Error Classes

For expected error conditions. Check with `instanceof`.

```typescript
export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly statusCode: number = 500
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`${resource} not found`, 'NOT_FOUND', 404);
	}
}

export class ValidationError extends AppError {
	constructor(
		message: string,
		public readonly field?: string
	) {
		super(message, 'VALIDATION_ERROR', 400);
	}
}

// Usage
if (error instanceof NotFoundError) {
	// handle not found
}
```

### Error Handling at Boundaries

Handle errors at the outermost layer — API route handlers, CLI script entry points. Convert domain errors to appropriate responses.

```typescript
// Next.js API route
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
	try {
		const { id } = await params;
		const user = await getUser(id);

		return Response.json(user);
	} catch (error) {
		if (error instanceof NotFoundError) {
			const body = { error: error.message };
			const responseOptions = { status: 404 };
			return Response.json(body, responseOptions);
		}

		const context = { err: error };
		logger.error(context, 'get user failed');

		const body = { error: 'internal error' };
		const responseOptions = { status: 500 };
		return Response.json(body, responseOptions);
	}
}
```

## Type Safety

### Never Use `any` Unless Absolutely Necessary

Order of preference: Fully typed → Generics → Semi-typed → `unknown` → `any` (last resort)

```typescript
// BAD: any everywhere
function findItem(items: any[], id: string): any {
	return items.find(item => item.id === id);
}

// GOOD: generic constraint
type Identifiable = { id: string };

function findItem<T extends Identifiable>(items: T[], id: string): T | undefined {
	return items.find(item => item.id === id);
}

// GOOD: multiple constraints
type Timestamped = { createdAt: Date };

function sortByCreation<T extends Identifiable & Timestamped>(items: T[]): T[] {
	return [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
```

### Order of Preference

```typescript
// 1. BEST: Fully typed
type ProcessorConfig = {
	timeout: number;
	retries: number;
	endpoint: string;
};

// 2. ACCEPTABLE: Semi-typed with known key types
type HandlerMap = Record<string, (ctx: Context) => Promise<void>>;

// 3. ACCEPTABLE: unknown for truly dynamic data
function parseJson(json: string): unknown {
	return JSON.parse(json);
}

// 4. LAST RESORT: any
type DynamicHandlers = Record<string, any>; // only when handlers have varying signatures
```

### Avoid Non-null Assertion (`!`)

The `!` operator silences the type checker without adding any runtime safety. Prefer proper narrowing, optional chaining, or an explicit throw.

```typescript
// BAD: non-null assertion hides potential null bugs
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

### JSON: Always Use Types with Zod Validation

```typescript
// BAD: Record<string, any>
function handleRequest(data: Record<string, any>) {
	const name = data.name as string; // unsafe assertion
}

// GOOD: Zod schema as single source of truth
const requestSchema = z.object({
	name: z.string(),
	age: z.number(),
	email: z.string().email().optional(),
});

type Request = z.infer<typeof requestSchema>;

function handleRequest(data: unknown): Request {
	return requestSchema.parse(data); // runtime validation + type safety
}
```

### Interface vs Type

Prefer `type` for most cases. Use `interface` only when you need declaration merging or class implementation contracts.

```typescript
// PREFERRED: type for data shapes, unions, function signatures
type User = {
	id: string;
	name: string;
	email: string;
};

type Status = 'pending' | 'active' | 'completed';
type Handler = (req: Request) => Promise<Response>;

// USE interface: for class implementation contracts
interface Repository<T> {
	findById(id: string): Promise<T | null>;
	save(item: T): Promise<void>;
}
```

### The `satisfies` Operator

Use `satisfies` to validate a value matches a type while preserving its literal type.

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
```

### Type Guards and Predicates

Use type predicates (`is`) to narrow types in conditional checks.

```typescript
function isUser(value: unknown): value is User {
	return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

// Array filtering with type guards
const mixed: (string | number)[] = [1, 'two', 3, 'four'];
const strings = mixed.filter((x): x is string => typeof x === 'string');

// Assertion functions (throws if not valid)
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

// Now the compiler catches mistakes
function getUser(userId: UserId): Promise<User> {
	/* ... */
}

const userId = UserId('user-123');
const postId = PostId('post-456');

getUser(userId); // ok
getUser(postId); // error: PostId not assignable to UserId
```

### Null vs Undefined Convention

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
	selectedUser: User | null; // null = explicitly no selection
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
	return [...items, 'new']; // must create new array
}

// const assertion for literal immutability
const config = {
	api: {
		url: 'https://api.example.com',
		timeout: 5000,
	},
	features: ['auth', 'logging'],
} as const;
// all properties are readonly, literal types preserved
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

// Usage
function processStatus(status: Status) {
	if (status === Status.PENDING) {
		// handle pending
	}
}

// AVOID: TypeScript enum
// enum Status { Pending, Active, Completed } // DON'T DO THIS

// ACCEPTABLE: string literal union for simple cases
type Priority = 'low' | 'medium' | 'high';
```

## Zod Schema Validation

Define schema first, infer type. Zod provides runtime validation and is the single source of truth.

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
const omittedUserFields = {
	id: true,
	createdAt: true,
};
const createUserSchema = userSchema.omit(omittedUserFields);
type CreateUserInput = z.infer<typeof createUserSchema>;

const updateUserSchema = createUserSchema.partial();
type UpdateUserInput = z.infer<typeof updateUserSchema>;

// BAD: defining types first then duplicating in schema
// type User = { id: string; name: string } // don't define separately
```

### Enums with Const Objects

```typescript
const PriorityLevel = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
} as const;

type PriorityLevel = (typeof PriorityLevel)[keyof typeof PriorityLevel];

// Extract values for z.enum (requires tuple assertion)
const priorityValues = Object.values(PriorityLevel) as [PriorityLevel, ...PriorityLevel[]];

const taskSchema = z.object({
	title: z.string(),
	priority: z.enum(priorityValues),
});
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
		strict: true, // strict mode on top-level schema for structured output
	});

type ExtractedEntity = z.infer<typeof extractedEntitySchema>;
```

### Parsing and Validation

```typescript
// Throws ZodError on invalid data
function processItem(data: unknown): Item {
	return itemSchema.parse(data);
}

// Returns result object instead of throwing
function safeProcessItem(data: unknown): Item | null {
	const result = itemSchema.safeParse(data);

	return result.success ? result.data : null;
}

// With error logging
function parseItemWithErrors(data: unknown): Item | null {
	const result = itemSchema.safeParse(data);

	if (!result.success) {
		const context = { errors: result.error.flatten() };
		logger.error(context, 'validation failed');

		return null;
	}

	return result.data;
}
```

## Async Patterns

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
	const query = { where: eq(users.id, id) };
	const user = await db.query.users.findFirst(query);

	if (!user) {
		throw new NotFoundError('user');
	}

	return user;
}
```

### Parallel Operations

```typescript
// Parallel fetch — all must succeed
async function fetchUserData(userId: string) {
	const [user, posts, followers] = await Promise.all([
		getUser(userId),
		getUserPosts(userId),
		getUserFollowers(userId),
	]);

	return {
		user,
		posts,
		followers,
	};
}

// Independent operations — partial failure is ok
async function fetchUserDataSafe(userId: string) {
	const [userResult, postsResult] = await Promise.allSettled([getUser(userId), getUserPosts(userId)]);

	return {
		user: userResult.status === 'fulfilled' ? userResult.value : null,
		posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
	};
}
```

### Bounded Concurrency

When processing many items concurrently (e.g., AI API calls), limit concurrency to avoid overwhelming the API or exhausting resources.

```typescript
import pLimit from 'p-limit';

// Sliding window concurrency — starts next item as soon as one finishes
const limit = pLimit(10);
const results = await Promise.all(items.map(item => limit(() => processItem(item))));
```

Prefer `p-limit` over chunked batching. Chunked batching (`Promise.all` per chunk) wastes time waiting for the slowest item in each chunk before starting the next. `p-limit` keeps all slots busy.

```typescript
// BAD: chunked batching — slow items block the whole chunk
for (let i = 0; i < items.length; i += 10) {
	const chunk = items.slice(i, i + 10);
	await Promise.all(chunk.map(processItem)); // waits for slowest in chunk
}

// GOOD: p-limit — starts next item as soon as a slot opens
const limit = pLimit(10);
await Promise.all(items.map(item => limit(() => processItem(item))));
```

## Project Structure

```
project/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # root layout
│   ├── page.tsx                  # home page
│   ├── error.tsx                 # error boundary
│   └── api/                      # API routes
│       └── health/
│           └── route.ts
│
├── components/                   # React components
│
├── lib/                          # shared libraries — the core
│   ├── ai/                       # AI SDK utilities
│   │   ├── provider.ts           # provider init + option presets
│   │   ├── prompts.ts            # prompt loader + schemaBlock
│   │   ├── structured.ts         # structured output wrapper
│   │   └── stream.ts             # stream wrapper
│   ├── db/                       # Drizzle ORM
│   │   ├── index.ts              # connection pool
│   │   ├── schema.ts             # table definitions
│   │   └── migrations/           # generated migrations
│   ├── config/
│   │   └── env.ts                # Zod-validated environment
│   ├── log.ts                    # pino structured logger
│   ├── errors.ts                 # application error types
│   ├── retry.ts                  # exponential backoff with jitter
│   └── concurrency.ts            # bounded parallel execution
│
├── prompts/                      # markdown prompt templates
│   └── example.md
│
├── scripts/                      # CLI scripts (run with tsx)
│   └── example.ts
│
├── .llm/
│   └── STYLE.md                  # this file
├── .env.example
├── drizzle.config.ts
├── eslint.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
├── Dockerfile
├── compose.yaml
└── README.md
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

- **No `index.ts` barrel files.** Import directly from source.
- **No `types.ts` files.** Co-locate types with the code that uses them.
- **Single-file utilities stay as files.** `lib/retry.ts`, not `lib/retry/index.ts`. If a utility grows to need multiple files, it becomes a directory.
- **Zod schemas live where they're used.** Don't create a central `schemas/` directory.
- **No `utils/` dump.** Every file in `lib/` has a clear, specific purpose.

## Configuration

### Environment Variables

Use Zod to validate environment variables at startup. Fail fast on invalid or missing config.

```typescript
// lib/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	DATABASE_URL: z.string().url(),
	OPENROUTER_API_KEY: z.string().min(1),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

This gives you:

- Type-safe `env.DATABASE_URL` across the codebase (no `process.env` scattered everywhere)
- Immediate crash at startup if required variables are missing
- Default values declared in one place
- Zero dependencies beyond Zod (already required by the AI SDK)

```typescript
// GOOD: import env from the config module
import { env } from '@/lib/config/env';

const pool = createPool(env.DATABASE_URL);

// BAD: reading process.env directly
const pool = createPool(process.env.DATABASE_URL!); // unsafe, no validation
```

## Logging

### Pino Setup

Use pino for structured JSON logging. Pretty-print in development only.

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

### Usage

Pino's API puts the data object first, message string second. All log messages lowercase.

```typescript
import { logger } from '@/lib/log';

// Structured data first, message second
const startup = { port: 3000 };
logger.info(startup, 'server starting');

const failedUser = {
	err,
	userId: '123',
};
logger.error(failedUser, 'failed to process user');

// Message only (no structured data)
logger.info('migration complete');

// Child loggers for scoped context
const childContext = {
	module: 'ai',
	script: 'process-document',
};
const log = logger.child(childContext);

const generation = {
	model: 'gpt-5',
	tokens: 1523,
};
log.info(generation, 'generation complete');
```

```typescript
// BAD: uppercase, string interpolation, console.log
console.log(`Starting server on port ${port}`);
logger.info(`User ${userId} created successfully`);

// GOOD: lowercase, structured
const serverContext = { port };
logger.info(serverContext, 'server starting');

const userContext = { userId };
logger.info(userContext, 'user created');
```

## Database Patterns (Drizzle)

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

// Infer types from schema — no separate type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Connection Setup

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from '@/lib/config/env';
import * as schema from '@/lib/db/schema';

export const db = drizzle(env.DATABASE_URL, { schema });
```

### Query Patterns

```typescript
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

// Select
const user = await db.query.users.findFirst({
	where: eq(users.id, userId),
});

// Insert
const [newUser] = await db
	.insert(users)
	.values({
		name: 'alice',
		email: 'alice@example.com',
	})
	.returning();

// Update
await db.update(users).set({ name: 'updated' }).where(eq(users.id, userId));

// Delete
await db.delete(users).where(eq(users.id, userId));
```

### Transactions

```typescript
const result = await db.transaction(async tx => {
	const [user] = await tx.insert(users).values(input).returning();
	const settings = {
		userId: user.id,
		theme: 'light',
	};
	await tx.insert(userSettings).values(settings);

	return user;
});
```

## AI SDK Patterns

### Provider Setup

One provider, one file, one export. Provider option presets for common configurations.

```typescript
// lib/ai/provider.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { env } from '@/lib/config/env';

export const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
});

// Provider option presets — OpenRouter-specific.
// When switching providers, update this file.
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
const structuredOptions = {
	model: openrouter('google/gemini-3-flash-preview'),
	system: loadPrompt('extract-entities'),
	messages: [
		{
			role: 'user',
			content: documentText,
		},
	],
};
const result = await structured(schema, structuredOptions);

// BAD: model constants baked into the template
import { FAST_MODEL } from '@/lib/ai/models'; // don't do this
```

### Structured Output

Use `generateText` with `Output.object()` for type-safe structured output. The `structured()` wrapper enforces this pattern and handles the null check.

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

Usage at the call site:

```typescript
import { structured } from '@/lib/ai/structured';
import { openrouter, providerOptions } from '@/lib/ai/provider';
import { loadPrompt, schemaBlock } from '@/lib/ai/prompts';

const promptVars = {
	RESPONSE_SCHEMA: schemaBlock(extractedEntitySchema),
};

const structuredOptions = {
	model: openrouter('google/gemini-3-flash-preview'),
	system: loadPrompt('extract-entities', promptVars),
	messages: [
		{
			role: 'user',
			content: documentText,
		},
	],
	providerOptions: providerOptions.reasoningOff,
};

const entities = await structured(extractedEntitySchema, structuredOptions);
```

### Streaming

Use `streamText` for chat interfaces and streaming responses.

```typescript
// lib/ai/stream.ts
import { type LanguageModel, streamText } from 'ai';

type StreamOptions = {
	model: LanguageModel;
	system?: string;
	messages: Array<{
		role: 'user' | 'assistant';
		content: string;
	}>;
	tools?: Record<string, unknown>;
	providerOptions?: Record<string, unknown>;
};

export function stream(options: StreamOptions) {
	return streamText(options);
}
```

In a Next.js API route:

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

Define tools with `inputSchema` (not `parameters` — deprecated).

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

		return results.map(r => {
			return {
				id: r.id,
				excerpt: r.content.slice(0, 200),
			};
		});
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

## Prompt Files

### File Organization

Prompts live as standalone Markdown files in `prompts/` at the project root. One file per prompt, named by purpose.

```
prompts/
├── extract-entities.md
├── classify-sentiment.md
├── chat.md
└── summarize.md
```

### Writing Prompts

Prompts are Markdown. Use `{{DIRECTIVE}}` placeholders for dynamic content injected at load time. Include the response schema documentation in the prompt.

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

### Loading Prompts

The prompt loader reads from `prompts/`, resolves `{{DIRECTIVE}}` placeholders, and validates that all directives are resolved and no unused variables are passed.

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

Usage:

```typescript
const systemPrompt = loadPrompt('extract-entities', {
	RESPONSE_SCHEMA: schemaBlock(extractedEntitySchema),
});
```

The bidirectional validation (unresolved directives AND unused variables) catches bugs in both directions — a renamed placeholder in the prompt file is caught immediately, and a stale variable in the code is caught too.

## CLI Script Patterns

### Script Structure

Scripts live in `scripts/` and run with `tsx`. Every script follows the same pattern: parse args, run main logic, handle fatal errors.

```typescript
// scripts/process-document.ts
import { parseArgs } from 'node:util';

import { logger } from '@/lib/log';
import { structured } from '@/lib/ai/structured';
import { openrouter } from '@/lib/ai/provider';
import { loadPrompt, schemaBlock } from '@/lib/ai/prompts';

const parseArgsOptions = {
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
};

const { values } = parseArgs(parseArgsOptions);

async function main() {
	if (!values.input) {
		throw new Error('--input is required');
	}

	const childContext = { script: 'process-document' };
	const log = logger.child(childContext);

	const startContext = {
		input: values.input,
		model: values.model,
	};
	log.info(startContext, 'starting');

	// ... main logic using lib/ imports ...

	log.info('done');
}

main().catch(err => {
	const context = { err };
	logger.error(context, 'script failed');
	process.exit(1);
});
```

### Running Scripts

```bash
pnpm tsx scripts/process-document.ts --input ./data/doc.pdf
pnpm tsx scripts/process-document.ts -i ./data/doc.pdf -m openai/gpt-5
```

### Key Rules

- Use `node:util` `parseArgs` for argument parsing. It's built into Node.js — no dependency needed.
- Import from `@/lib/` via path aliases. Scripts share the same libraries as the Next.js app.
- Use `logger.child()` for scoped logging within scripts.
- Fatal errors go to `process.exit(1)` in the top-level `.catch()`.
- Never put business logic in the script file. Import it from `lib/`.

## Next.js Patterns

### Server Components (Default)

Components are server components by default. They can be async, fetch data directly, and access server-only resources.

```typescript
// app/documents/page.tsx — this is a server component
import { db } from '@/lib/db'
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

Add `'use client'` only when you need browser APIs, event handlers, or React hooks (useState, useEffect, etc.).

```typescript
// components/search-input.tsx
'use client'

import { useState } from 'react'

export function SearchInput({ onSearch }: { onSearch: (query: string) => void }) {
	const [query, setQuery] = useState('')

	return (
		<input
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
		/>
	)
}
```

**Push `'use client'` as far down as possible.** Keep pages and layouts as server components. Only mark the specific interactive component as client.

### API Routes

```typescript
// app/api/documents/route.ts
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { logger } from '@/lib/log';
import { NotFoundError } from '@/lib/errors';

export async function GET(): Promise<Response> {
	const docs = await db.query.documents.findMany();

	return Response.json(docs);
}

export async function POST(request: Request): Promise<Response> {
	try {
		const body = await request.json();
		const input = createDocumentSchema.parse(body);

		const [doc] = await db.insert(documents).values(input).returning();

		const responseOptions = { status: 201 };
		return Response.json(doc, responseOptions);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorBody = {
				error: 'validation failed',
				details: error.flatten(),
			};
			const responseOptions = { status: 400 };
			return Response.json(errorBody, responseOptions);
		}

		const context = { err: error };
		logger.error(context, 'create document failed');

		const errorBody = { error: 'internal error' };
		const responseOptions = { status: 500 };
		return Response.json(errorBody, responseOptions);
	}
}
```

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

## Newline Spacing

Use blank lines to separate logical groups within a function body. A `return` statement should have a preceding blank line. Closely related statements (a variable and the loop that immediately uses it) stay together.

```typescript
// GOOD: grouped by intent, return has breathing room
async function processItems(items: Item[]): Promise<number> {
	const validated = items.filter(item => item.isValid);

	const results = await Promise.all(validated.map(item => transform(item)));

	const total = results.reduce((sum, r) => sum + r.value, 0);

	if (total === 0) {
		throw new ValidationError('no valid items to process');
	}

	return total;
}

// BAD: everything jammed together
async function processItems(items: Item[]): Promise<number> {
	const validated = items.filter(item => item.isValid);
	const results = await Promise.all(validated.map(item => transform(item)));
	const total = results.reduce((sum, r) => sum + r.value, 0);
	if (total === 0) {
		throw new ValidationError('no valid items to process');
	}
	return total;
}
```

## Development Workflow

### Type Checking

```bash
pnpm typecheck  # tsc --noEmit — catches type errors without building
```

Use during development, pre-commit hooks, and CI. Faster than a full build for quick validation.

### Dependency Management

```bash
pnpm add package-name           # add runtime dependency
pnpm add -D package-name        # add dev dependency
pnpm update --latest            # update all (only when explicitly asked)
```

### Linting and Formatting

```bash
pnpm lint         # eslint
pnpm format       # prettier --write
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

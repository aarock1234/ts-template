# TypeScript Style Guide

Project-agnostic TypeScript style guide. Favor idiomatic TypeScript over clever abstractions.

**Minimum TypeScript version**: 5.0+ (examples use `satisfies`, `const` type parameters, and modern strict settings).

## Philosophy

Write boring code. Prefer explicit over implicit. Optimize for reading, not writing. Keep functions small and focused. Use the type system to prevent bugs at compile time.

## Quick Reference

### Tools

```bash
pnpm typecheck               # type check without building
pnpm lint                    # lint with @typescript-eslint
pnpm format:check            # check formatting
```

### Import Order

Three groups, blank line between each: external packages, internal modules, relative imports.

```typescript
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

import { config } from '@/config';
import { logger } from '@/lib/logger';

import { UserService } from './user.service';
import type { User } from './user.service';

import './side-effects'; // side-effect imports last with comment
```

**`import type` vs regular imports:** Use `import type` for types/interfaces (erased at compile time). Regular imports for runtime values. Benefits: smaller bundles, avoids circular deps, clearer intent.

### Exports

**Inline exports.** Export at the declaration site, not at the bottom of the file. This is the standard TypeScript convention — the export travels with the code, so intent is visible immediately and refactors don't require updating a separate list.

```typescript
// GOOD: inline export
export const MAX_RETRIES = 3;

export type UserConfig = {
	timeout: number;
	retries: number;
};

export function getUser(id: string): Promise<User> {
	return db.user.findUnique({ where: { id } });
}

export class UserService {
	constructor(private readonly db: Database) {}
}
```

```typescript
// BAD: bottom-of-file export list
const MAX_RETRIES = 3;

type UserConfig = {
	timeout: number;
	retries: number;
};

function getUser(id: string): Promise<User> {
	return db.user.findUnique({ where: { id } });
}

class UserService {
	constructor(private readonly db: Database) {}
}

export { MAX_RETRIES, UserConfig, getUser, UserService }; // DON'T DO THIS
```

**Named exports over default exports.** Named exports are grep-friendly, refactor-safe, and give consistent names across the codebase. Default exports create ambiguity — the consumer can name the import anything, making it harder to trace usage.

```typescript
// GOOD: named export
export function createLogger(name: string): Logger {
	// ...
}

// BAD: default export
export default function createLogger(name: string): Logger {
	// ...
}
```

The one exception: framework conventions that require default exports (e.g. Next.js pages, Remix routes). Follow the framework's convention in those cases.

**`export type` for type-only exports.** Mirrors `import type` — erased at compile time, keeps the runtime bundle clean.

```typescript
export type UserId = Brand<string, 'UserId'>;
export type ApiResponse = { data: unknown; status: number };
```

### Naming Conventions

| Category          | Convention      | Examples                              |
| ----------------- | --------------- | ------------------------------------- |
| Classes           | PascalCase      | `UserService`, `HttpClient`           |
| Interfaces/Types  | PascalCase      | `UserConfig`, `ApiResponse`           |
| Functions/Methods | camelCase       | `getUser`, `processItems`             |
| Variables         | camelCase       | `userId`, `isActive`                  |
| Booleans          | `is/has/should/can` prefix | `isActive`, `hasPermission`, `shouldRetry` |
| Constants         | camelCase       | `defaultTimeout`, `maxRetries`        |
| Module constants  | SCREAMING_SNAKE | `MAX_RETRIES`, `DEFAULT_TIMEOUT`      |
| Const obj (name)  | PascalCase      | `Status`, `PriorityLevel`             |
| Const obj (keys)  | SCREAMING_SNAKE | `Status.PENDING`, `Status.ACTIVE`     |
| Zod schemas       | camelCase       | `userSchema`, `createUserSchema`      |
| Files             | kebab-case      | `user-service.ts`, `http-client.ts`   |
| Type parameters   | Single char     | `T`, `K`, `V` or descriptive `TInput` |

**Boolean names** should read as yes/no questions. This applies to variables, properties, parameters, and functions that return booleans.

```typescript
// GOOD: reads as a question
const isValid = schema.safeParse(data).success;
const hasChildren = node.children.length > 0;
function shouldRetry(attempt: number, error: Error): boolean { /* ... */ }

// BAD: ambiguous — is this a noun, a verb, an adjective?
const valid = schema.safeParse(data).success;
const children = node.children.length > 0;
function retry(attempt: number, error: Error): boolean { /* ... */ }
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
	// ...
}

// BAD
var timeout = 5000; // never var
let baseUrl = 'https://api.example.com'; // never reassigned — use const
```

## Comments

Use Go-style doc comments: a plain comment directly above the declaration explaining what it does and why. No section comments, banners, or visual separators.

```typescript
// BAD: section banners / visual separators
// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const userSchema = z.object({
	// ...
});

// BAD: other banner styles
// ========================
// Helper functions
// ========================

// ********** Constants **********

/* ---- Middleware ---- */
```

```typescript
// GOOD: doc comment above the declaration when clarification is needed
// Validates user input before persistence; strips unknown keys.
const userSchema = z.object({
	// ...
});

// Retries with exponential backoff; gives up after the configured max attempts.
async function fetchWithRetry(url: string, options: FetchOptions): Promise<Response> {
	// ...
}
```

**Rules:**

- Comment directly above the thing you're documenting (function, type, const, class).
- Explain _what_ or _why_, not _what section we're in_.
- If code is self-explanatory, don't comment at all.
- Never use decorative separators (`---`, `===`, `***`, `////`, etc.) to create visual sections.
- Use file/module boundaries (separate files) to organize code into sections, not comments.

## Functions

### Arrow Functions vs Declarations

Use `function` declarations for top-level and exported functions. Use arrow functions for callbacks and inline expressions. Use method shorthand in objects and classes.

```typescript
// GOOD: function declaration for top-level / exported
export function createUser(input: CreateUserInput): Promise<User> {
	// ...
}

// GOOD: arrow for callbacks
const activeUsers = users.filter((user) => user.isActive);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// GOOD: method shorthand in objects
const userRepository = {
	async findById(id: string) {
		return db.user.findUnique({ where: { id } });
	},
};

// BAD: arrow for top-level function (no hoisting, anonymous in stack traces)
export const createUser = async (input: CreateUserInput): Promise<User> => {
	// ...
};

// BAD: function expression as callback
users.filter(function (user) {
	return user.isActive;
});
```

**Why:** `function` declarations are hoisted (usable before their definition in the file), show the function name in stack traces and debuggers, and stand out visually as top-level units. Arrows are concise and capture `this` lexically, making them ideal for callbacks.

### Explicit Return Types

Write explicit return types on exported functions. Omit them on internal functions where inference is clear.

```typescript
// GOOD: explicit return type on exports — documents the contract
export function getUser(id: string): Promise<User> {
	return db.user.findUnique({ where: { id } });
}

export function parseConfig(raw: string): Result<Config> {
	// ...
}

// GOOD: omit on internal functions where the type is obvious
function buildWhereClause(filters: Filters) {
	return {
		...(filters.status && { status: filters.status }),
		...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
	};
}

// GOOD: omit on simple callbacks
const names = users.map((user) => user.name);
```

**Why:** Explicit return types on exports catch accidental return type changes at the definition site instead of at every call site, produce clearer error messages, and serve as documentation. For internal functions, inference keeps things concise without losing safety.

## Control Flow

### Guard Clauses

Handle invalid cases first and return/throw early. This eliminates nesting and keeps the main logic at the top indentation level.

```typescript
// BAD: nested conditionals
async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
	const user = await db.user.findUnique({ where: { id } });
	if (user) {
		if (user.isActive) {
			const updated = await db.user.update({ where: { id }, data: input });
			return updated;
		} else {
			throw new ForbiddenError(`user ${id} is deactivated`);
		}
	} else {
		throw new NotFoundError(`user ${id}`);
	}
}

// GOOD: guard clauses, flat structure
async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
	const user = await db.user.findUnique({ where: { id } });

	if (!user) {
		throw new NotFoundError(`user ${id}`);
	}

	if (!user.isActive) {
		throw new ForbiddenError(`user ${id} is deactivated`);
	}

	return db.user.update({ where: { id }, data: input });
}
```

The pattern: validate preconditions at the top, exit early on failure, then proceed with the happy path unindented. Always use blocks for `if` statements — no braceless one-liners.

### Ternaries

Use ternaries for simple, single-condition expressions. Never nest them.

```typescript
// GOOD: simple ternary
const label = isActive ? 'enabled' : 'disabled';
const timeout = isProduction ? 30_000 : 5_000;

// BAD: nested ternary — use if/else or a function
const label = isAdmin ? 'admin' : isModerator ? 'moderator' : isActive ? 'user' : 'guest';

// GOOD: extract to a function or use if/else
function getRoleLabel(user: User): string {
	if (user.isAdmin) {
		return 'admin';
	}

	if (user.isModerator) {
		return 'moderator';
	}

	if (user.isActive) {
		return 'user';
	}

	return 'guest';
}
```

## Error Handling

### Basic Pattern

Throw custom errors with context. Let errors propagate — log at the boundary (handler/controller), not at every layer.

```typescript
async function getUser(id: string): Promise<User> {
	const user = await db.user.findUnique({ where: { id } });

	if (!user) {
		throw new NotFoundError(`user ${id}`);
	}

	return user;
}
```

```typescript
// Error handling at the boundary (handler/controller)
async function handleGetUser(req: Request, res: Response) {
	try {
		const user = await getUser(req.params.id);
		res.json(user);
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			res.status(404).json({ error: error.message });
			return;
		}

		logger.error('get user failed', { error });
		res.status(500).json({ error: 'internal error' });
	}
}
```

Error messages: lowercase, no punctuation, add context.

### Custom Error Classes

For expected error conditions. Check with `instanceof`.

```typescript
class AppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly statusCode: number = 500
	) {
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`${resource} not found`, 'NOT_FOUND', 404);
	}
}

class ValidationError extends AppError {
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

### Result Pattern (Alternative)

For functions where errors are expected and frequent.

```typescript
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

const configSchema = z.object({
	port: z.number(),
	host: z.string(),
});

type Config = z.infer<typeof configSchema>;

function parseConfig(raw: string): Result<Config> {
	try {
		const data = JSON.parse(raw);
		return {
			success: true,
			data: configSchema.parse(data),
		};
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		return {
			success: false,
			error,
		};
	}
}

// Usage
const result = parseConfig(input);

if (result.success) {
	console.log(result.data);
} else {
	console.error(result.error);
}
```

## Class Patterns

### Constructor Pattern

```typescript
class UserService {
	constructor(
		private readonly db: Database,
		private readonly logger: Logger,
		private readonly timeout = 10_000
	) {}
}
```

### Options Pattern

For complex configuration.

```typescript
type ServiceOptions = {
	timeout?: number;
	retries?: number;
	logger?: Logger;
};

class ApiClient {
	private readonly timeout: number;
	private readonly retries: number;
	private readonly logger: Logger;

	constructor(baseUrl: string, options: ServiceOptions = {}) {
		this.timeout = options.timeout ?? 10_000;
		this.retries = options.retries ?? 3;
		this.logger = options.logger ?? console;
	}
}

// Usage
const client = new ApiClient('https://api.example.com', {
	timeout: 5000,
	retries: 5,
});
```

### Abstract Base Classes

For shared behavior across implementations.

For simple shared logic, prefer composition (shared functions, dependency injection) over class hierarchies. Use abstract classes when you need enforced method contracts across a family of related implementations.

```typescript
// Input -> output pattern
abstract class BaseProcessor<TInput, TOutput> {
	protected constructor(
		protected readonly logger: Logger,
		protected readonly config: ProcessorConfig
	) {}

	async process(input: TInput): Promise<TOutput> {
		this.validate(input);
		return this.execute(input);
	}

	protected validate(input: TInput): void {
		if (input == null) {
			throw new ValidationError('input is required');
		}
	}

	protected abstract execute(input: TInput): Promise<TOutput>;
}

class PdfProcessor extends BaseProcessor<PdfInput, PdfOutput> {
	protected async execute(input: PdfInput): Promise<PdfOutput> {
		// PDF-specific processing
		return {
			/* ... */
		};
	}
}
```

## Strings

### Prefer Template Literals Over String Concatenation

Use template literals (backtick strings) for building strings. Never use string concatenation (`+`) unless there is a specific reason it is necessary (e.g., performance-critical hot paths where the engine optimizes `+` better, or building strings incrementally in a loop with an accumulator).

```typescript
// BAD: string concatenation
const greeting = 'hello, ' + name + '!';
const url = baseUrl + '/users/' + userId + '/posts';
const message = 'user ' + user.name + ' (' + user.email + ') signed in';

// GOOD: template literals
const greeting = `hello, ${name}!`;
const url = `${baseUrl}/users/${userId}/posts`;
const message = `user ${user.name} (${user.email}) signed in`;

// BAD: concatenation for multi-line strings
const html = '<div class="card">' + '\n' + '  <h1>' + title + '</h1>' + '\n' + '</div>';

// GOOD: template literals for multi-line strings
const html = `<div class="card">
  <h1>${title}</h1>
</div>`;

// ACCEPTABLE: concatenation in a loop accumulator
let csv = '';
for (const row of rows) {
	csv += row.join(',') + '\n';
}
```

## Object Literals

Use multiline format for objects with two or more properties. One property per line, trailing comma. Single-property objects may stay on one line when the result is short and readable.

```typescript
// GOOD: multiline for two or more properties
const config = {
	timeout: 5000,
	retries: 3,
};
return {
	success: true,
	data,
};

// GOOD: single-property objects on one line
return { data };
res.json({ error: error.message });
throw new AppError('failed', { cause: error });

// BAD: multiple properties crammed on one line
const config = { timeout: 5000, retries: 3 };
return { success: true, data };
```

## Type Safety

### Never Use `any` Unless Absolutely Necessary

Order of preference: Fully typed -> Generics -> Semi-typed -> `unknown` -> `any` (last resort)

```typescript
// BAD: any everywhere
function findItem(items: any[], id: string): any {
	return items.find(item => item.id === id);
}

// GOOD: named type + generic constraint
type Identifiable = {
	id: string;
};

function findItem<T extends Identifiable>(items: T[], id: string): T | undefined {
	return items.find(item => item.id === id);
}

// GOOD: multiple constraints
type Timestamped = {
	createdAt: Date;
};

function sortByCreation<T extends Identifiable & Timestamped>(items: T[]): T[] {
	return [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// GOOD: generics for container types
type CacheEntry<T> = {
	data: T;
	expiresAt: number;
};

type Cache<T> = Map<string, CacheEntry<T>>;

function createCache<T>(ttlMs: number): Cache<T> {
	return new Map();
}

function cacheGet<T>(cache: Cache<T>, key: string): T | undefined {
	const entry = cache.get(key);

	if (!entry) {
		return undefined;
	}

	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}

	return entry.data;
}

function cacheSet<T>(cache: Cache<T>, key: string, data: T, ttlMs: number): void {
	cache.set(key, {
		data,
		expiresAt: Date.now() + ttlMs,
	});
}

// Usage - type flows through automatically
const userCache = createCache<User>(60_000);
cacheSet(userCache, 'user-123', user, 60_000);
const cached = cacheGet(userCache, 'user-123'); // type: User | undefined
```

### Order of Preference Examples

```typescript
// 1. BEST: Fully typed
type ProcessorConfig = {
	timeout: number;
	retries: number;
	endpoint: string;
};

// 2. ACCEPTABLE: Semi-typed with known key types
type ProcessorRegistry = Record<string, ProcessorConfig>;
type HandlerMap = Record<string, (ctx: Context, item: Item) => Promise<void>>;

// 3. ACCEPTABLE: Semi-typed with union values
type StatusMap = Record<string, 'pending' | 'processing' | 'completed'>;

// 4. ACCEPTABLE: unknown for truly dynamic data
function parseJson(json: string): unknown {
	return JSON.parse(json);
}

// 5. LAST RESORT: any
type DynamicHandlers = Record<string, any>; // Only when handlers have varying signatures

// 6. AVOID: Fully untyped
// type BadRecord = Record<any, any>; // DON'T DO THIS
```

### Avoid Non-null Assertion (`!`)

The `!` operator tells the compiler "trust me, this isn't null" — it silences the type checker without adding any runtime safety. Prefer proper narrowing, optional chaining, or an explicit throw.

```typescript
// BAD: non-null assertion hides potential null bugs
const name = user!.name;
const first = items.find((i) => i.isActive)!;
document.getElementById('root')!.innerHTML = '';

// GOOD: narrow with a check
if (!user) {
	throw new NotFoundError('user');
}

const name = user.name;

// GOOD: optional chaining when null is acceptable
const name = user?.name ?? 'anonymous';

// GOOD: assert with a meaningful error
const root = document.getElementById('root');

if (!root) {
	throw new Error('missing root element');
}

root.innerHTML = '';
```

The only acceptable use is in test code where a preceding assertion guarantees the value exists and the test should fail loudly if it doesn't.

### JSON: Always Use Types with Zod Validation

```typescript
import { z } from 'zod';

// BAD: Record<string, any>
function handleRequest(data: Record<string, any>) {
	const name = data.name as string; // unsafe type assertion
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

// Safe parsing for non-throwing validation
function safeParseRequest(data: unknown) {
	const result = requestSchema.safeParse(data);

	if (result.success) {
		return result.data; // Type: Request
	} else {
		logger.error('validation failed', { error: result.error });
		return null;
	}
}
```

Only use `Record<string, any>` when structure is truly dynamic (plugin configs, user-defined metadata).

### Interface vs Type

Prefer `type` for most cases. Use `interface` only when you need declaration merging.

```typescript
// PREFERRED: type for data shapes
type User = {
	id: string;
	name: string;
	email: string;
};

// PREFERRED: type for unions
type Status = 'pending' | 'active' | 'completed';

// PREFERRED: type for function signatures
type Handler = (req: Request, res: Response) => Promise<void>;

// USE interface: when you need declaration merging
interface Window {
	myCustomProperty: string;
}

// USE interface: for class implementation contracts
interface Repository<T> {
	findById(id: string): Promise<T | null>;
	save(item: T): Promise<void>;
}

class UserRepository implements Repository<User> {
	// ...
}
```

**Performance note:** For extending object shapes, prefer `interface extends` over `type &` (intersection). Interfaces produce clearer error messages and are faster for the type checker in large codebases.

### The `satisfies` Operator

Use `satisfies` to validate a value matches a type while preserving its literal type. Available in TypeScript 4.9+.

```typescript
// BAD: type annotation widens literals
const config: Record<string, string> = {
	apiUrl: 'https://api.example.com',
	env: 'production',
};
config.apiUrl; // type: string (literals lost)
config.typo; // no error! Record allows any string key

// GOOD: satisfies validates AND preserves literals
const config = {
	apiUrl: 'https://api.example.com',
	env: 'production',
} satisfies Record<string, string>;

config.apiUrl; // type: "https://api.example.com" (literal preserved)
config.typo; // error: property 'typo' does not exist

// GOOD: satisfies with specific type
type Theme = {
	colors: Record<string, string>;
	spacing: Record<string, number>;
};

const theme = {
	colors: {
		primary: '#007bff',
		secondary: '#6c757d',
	},
	spacing: {
		small: 8,
		medium: 16,
		large: 24,
	},
} satisfies Theme;

theme.colors.primary; // type: "#007bff" (literal preserved)
theme.spacing.small; // type: 8 (literal preserved)

// GOOD: satisfies for route config (common use case)
const routes = {
	home: '/',
	users: '/users',
	user: '/users/:id',
} satisfies Record<string, string>;

type RouteKey = keyof typeof routes; // "home" | "users" | "user"
```

### Type Guards and Predicates

Use type predicates (`is`) to narrow types in conditional checks.

```typescript
// Type predicate function
function isString(value: unknown): value is string {
	return typeof value === 'string';
}

// Basic type guard; checks structure exists
function isUser(value: unknown): value is User {
	return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

// Thorough type guard; validates property types
function isUserStrict(value: unknown): value is User {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const obj = value as Record<string, unknown>;
	return typeof obj.id === 'string' && typeof obj.email === 'string';
}

// Usage
function processValue(value: unknown) {
	if (isString(value)) {
		console.log(value.toUpperCase()); // value is string here
	}
}

// Type guard for discriminated unions
type ApiResult = { status: 'success'; data: User } | { status: 'error'; message: string };

function isSuccess(result: ApiResult): result is { status: 'success'; data: User } {
	return result.status === 'success';
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

function processUser(data: unknown) {
	assertIsUser(data);
	console.log(data.email); // data is User from here on
}
```

### Exhaustive Switch

When switching over a discriminated union or const-object type, use the `never` trick to make the compiler catch unhandled cases. If a new variant is added later, every switch that forgot to handle it becomes a compile error.

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

If someone adds `CANCELLED` to `Status`, the `default` branch will fail to compile because `'cancelled'` is not assignable to `never`. This turns a potential runtime bug into a compile-time error.

### Branded Types (Nominal Typing)

Prevent mixing up values that share the same base type.

```typescript
// Problem: all IDs are strings, easy to mix up
function getUser(userId: string): Promise<User>;
function getPost(postId: string): Promise<Post>;

getUser(postId); // no error! but semantically wrong

// Solution: branded types
type Brand<T, B> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;
type OrderId = Brand<string, 'OrderId'>;

// Constructor functions
function UserId(id: string): UserId {
	return id as UserId;
}

function PostId(id: string): PostId {
	return id as PostId;
}

// Now the compiler catches mistakes
function getUser(userId: UserId): Promise<User>;
function getPost(postId: PostId): Promise<Post>;

const userId = UserId('user-123');
const postId = PostId('post-456');

getUser(userId); // ok
getUser(postId); // error: PostId not assignable to UserId

// Works with Zod too
const UserIdSchema = z.string().uuid().transform(UserId);
const PostIdSchema = z.string().uuid().transform(PostId);
```

### Utility Types

Built-in utility types for transforming existing types.

```typescript
type User = {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'user';
	createdAt: Date;
};

// Property modifiers
type UserUpdate = Partial<User>; // all properties optional
type RequiredUser = Required<Partial<User>>; // all properties required
type ImmutableUser = Readonly<User>; // all properties readonly

// Property selection
type UserPreview = Pick<User, 'id' | 'name'>; // select specific properties
type CreateUser = Omit<User, 'id' | 'createdAt'>; // exclude specific properties

// Object construction
type UserMap = Record<string, User>; // object with keys K and values V
type RolePermissions = Record<User['role'], string[]>;

// Union manipulation
type StringOrNumber = string | number | boolean;
type OnlyStrNum = Extract<StringOrNumber, string | number>; // extract types assignable to U
type NotBoolean = Exclude<StringOrNumber, boolean>; // remove types assignable to U
type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // remove null and undefined

// Function introspection
function createUser(name: string): User {
	return { id: '1', name, email: '', role: 'user', createdAt: new Date() };
}
type CreatedUser = ReturnType<typeof createUser>; // get return type of function
type CreateUserParams = Parameters<typeof createUser>; // get parameter types as tuple

// Promise unwrapping
type UserPromise = Promise<User>;
type ResolvedUser = Awaited<UserPromise>; // unwrap Promise type
```

### Readonly and Immutability

Prefer immutable data. Use `readonly` for arrays and properties that shouldn't change.

```typescript
// Readonly properties
type User = {
	readonly id: string;
	readonly createdAt: Date;
	name: string; // mutable
};

// Readonly arrays
function processItems(items: readonly string[]) {
	items.push('new'); // error: push doesn't exist on readonly array
	items[0] = 'modified'; // error: index signature is readonly

	// Must create new array for modifications
	return [...items, 'new'];
}

// ReadonlyArray<T> equivalent
function processNumbers(nums: ReadonlyArray<number>) {
	return nums.map(n => n * 2); // ok, map returns new array
}

// Readonly for deep immutability
type DeepReadonly<T> = T extends (infer U)[]
	? readonly DeepReadonly<U>[]
	: T extends object
		? { readonly [K in keyof T]: DeepReadonly<T[K]> }
		: T;

// const assertion for literal immutability
const config = {
	api: {
		url: 'https://api.example.com',
		timeout: 5000,
	},
	features: ['auth', 'logging'],
} as const;

// All properties are readonly and literal types preserved
config.api.url; // type: "https://api.example.com"
config.features; // type: readonly ["auth", "logging"]
```

### Null vs Undefined Convention

`undefined` is for structural absence — the language produces it when a property doesn't exist, `Map.get()` misses, or `Array.find()` fails. `null` is for intentional "no value" — the developer explicitly chose it.

- Let `undefined` arise naturally from optional properties and language APIs
- Use `null` when you need to express "this has no value" at the value level

```typescript
// undefined: structural absence (optional properties, language APIs)
type User = {
	id: string;
	name: string;
	nickname?: string; // equivalent to: nickname: string | undefined
};

function findUser(id: string): User | undefined {
	// Map.get, Array.find, optional props — language produces undefined
}

// null: intentional "no value" chosen by the developer
type Form = {
	selectedUser: User | null; // null = explicitly no selection
};

const [data, setData] = useState<User | null>(null); // not yet loaded
const [error, setError] = useState<string | null>(null); // no error

// Optional chaining works with both
const name = user?.nickname ?? 'Anonymous';

// Nullish coalescing (??) vs OR (||)
const count = input ?? 0; // only null/undefined trigger fallback
const count2 = input || 0; // 0, "", false also trigger fallback (usually wrong)
```

### Template Literal Types

Type-safe string patterns.

```typescript
// Type-safe event names
type EventName = `on${Capitalize<'click' | 'focus' | 'blur'>}`;
// "onClick" | "onFocus" | "onBlur"

// Type-safe CSS properties
type CssUnit = 'px' | 'rem' | 'em' | '%';
type CssValue = `${number}${CssUnit}`;
// "10px", "1.5rem", etc.

// Type-safe route params
type RouteParam<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
	? Param | RouteParam<Rest>
	: T extends `${string}:${infer Param}`
		? Param
		: never;

type UserRouteParams = RouteParam<'/users/:userId/posts/:postId'>;
// "userId" | "postId"

// Type-safe object paths
type PathKeys<T, Prefix extends string = ''> = T extends object
	? {
			[K in keyof T & string]: T[K] extends object ? PathKeys<T[K], `${Prefix}${K}.`> : `${Prefix}${K}`;
		}[keyof T & string]
	: never;

type User = {
	name: string;
	address: {
		city: string;
		zip: string;
	};
};
type UserPaths = PathKeys<User>; // "name" | "address.city" | "address.zip"
```

### Conditional Types and `infer`

Extract types within conditional type expressions.

```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer U)[] ? U : never;
type Item = ArrayElement<string[]>; // string

// Extract promise result type
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type Result = Unwrap<Promise<User>>; // User

// Extract function return type (how ReturnType works)
type Return<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract first argument type
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;
type Arg = FirstArg<(name: string, age: number) => void>; // string

// Extract object value types
type ValueOf<T> = T extends Record<string, infer V> ? V : never;
type Values = ValueOf<{ a: string; b: number }>; // string | number

// Practical: extract props from React component
type PropsOf<T> = T extends (props: infer P) => any ? P : never;
```

## Async Patterns

### Async/Await

Always use async/await over raw Promises.

```typescript
// BAD: Promise chains
function getUser(id: string) {
	return db.user
		.findUnique({ where: { id } })
		.then(user => {
			if (!user) throw new NotFoundError('user');
			return user;
		})
		.catch(error => {
			logger.error('failed', { error });
			throw error;
		});
}

// GOOD: async/await
async function getUser(id: string): Promise<User> {
	try {
		const user = await db.user.findUnique({ where: { id } });

		if (!user) {
			throw new NotFoundError('user');
		}

		return user;
	} catch (error) {
		logger.error('failed', { error });
		throw error;
	}
}
```

### Parallel Operations

```typescript
// Parallel fetch
async function fetchUserData(userId: string) {
	const [user, posts, followers] = await Promise.all([
		getUser(userId),
		getUserPosts(userId),
		getUserFollowers(userId),
	]);

	return { user, posts, followers };
}

// Per-operation error handling
async function fetchUserDataSafe(userId: string) {
	const results = await Promise.allSettled([getUser(userId), getUserPosts(userId), getUserFollowers(userId)]);

	const [userResult, postsResult, followersResult] = results;

	return {
		user: userResult.status === 'fulfilled' ? userResult.value : null,
		posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
		followers: followersResult.status === 'fulfilled' ? followersResult.value : [],
	};
}
```

### Concurrent Processing with Limit

**Simple chunked approach**; fixed-size batches, waits for each batch to complete.

```typescript
async function processInChunks<T, R>(items: T[], fn: (item: T) => Promise<R>, chunkSize: number): Promise<R[]> {
	const results: R[] = [];
	for (let i = 0; i < items.length; i += chunkSize) {
		const chunk = items.slice(i, i + chunkSize);
		const chunkResults = await Promise.all(chunk.map(fn));
		results.push(...chunkResults);
	}
	return results;
}

// Usage
const processed = await processInChunks(items, processItem, 10);
```

**True concurrency limiting**: use `p-limit` for sliding window concurrency.

```typescript
import pLimit from 'p-limit';

const limit = pLimit(10); // max 10 concurrent
const results = await Promise.all(items.map(item => limit(() => processItem(item))));
```

## HTTP Client Pattern

Wrap fetch with AbortController timeout and typed responses.

```typescript
class HttpError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(`http ${status}: ${message}`);
		this.name = 'HttpError';
	}
}

class TimeoutError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TimeoutError';
	}
}

class HttpClient {
	constructor(
		private readonly baseUrl: string,
		private readonly defaultTimeout = 10_000,
		private readonly defaultHeaders: Record<string, string> = {}
	) {}

	async request<T>(method: string, path: string, body?: unknown, timeout?: number): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout ?? this.defaultTimeout);

		try {
			const response = await fetch(`${this.baseUrl}${path}`, {
				method,
				headers: {
					'Content-Type': 'application/json',
					...this.defaultHeaders,
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new HttpError(response.status, await response.text());
			}

			return response.json() as Promise<T>; // caller must validate shape (e.g. with Zod)
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new TimeoutError(`request to ${path} timed out`);
			}

			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	get<T>(path: string, timeout?: number) {
		return this.request<T>('GET', path, undefined, timeout);
	}

	post<T>(path: string, body: unknown, timeout?: number) {
		return this.request<T>('POST', path, body, timeout);
	}
}

// Usage
const client = new HttpClient('https://api.example.com', 5000, {
	Authorization: 'Bearer token',
});
const user = await client.get<User>('/users/123');
```

## Code Organization

### Project Structure

**API/Server:**

```
src/
├── routes/
├── services/
├── repositories/
├── middleware/
├── lib/
├── config.ts
└── main.ts
```

**Library/Package:**

```
src/
├── core/
├── utils/
├── lib.ts
└── main.ts
```

**CLI Tool:**

```
src/
├── commands/
├── utils/
├── config.ts
└── main.ts
```

**Worker/Job Processor:**

```
src/
├── jobs/
├── processors/
├── queues/
├── lib/
└── main.ts
```

Guidelines:

- No `index.ts` barrel files; import directly from source
- No `types.ts` files; co-locate types with the code that uses them
- Zod schemas live where they're used
- Export inline at the declaration site (see [Exports](#exports))

### Layered Architecture

**Repository Layer** (Data access)

```typescript
type UserRepository = {
	findById(id: string): Promise<User | null>;
	save(user: User): Promise<void>;
};

// In production, add proper error handling
function createUserRepository(db: Database): UserRepository {
	return {
		async findById(id) {
			return db.user.findUnique({
				where: {
					id,
				},
			});
		},
		async save(user) {
			await db.user.upsert({
				where: {
					id: user.id,
				},
				create: user,
				update: user,
			});
		},
	};
}
```

**Service Layer** (Business logic)

```typescript
class UserService {
	constructor(
		private readonly repo: UserRepository,
		private readonly logger: Logger
	) {}

	async getUser(id: string): Promise<User> {
		const user = await this.repo.findById(id);

		if (!user) {
			throw new NotFoundError(`user ${id}`);
		}

		return user;
	}
}
```

**Controller/Handler Layer** (HTTP/transport)

```typescript
class UserController {
	constructor(
		private readonly service: UserService,
		private readonly logger: Logger
	) {}

	async getUser(req: Request, res: Response) {
		try {
			const user = await this.service.getUser(req.params.id);
			res.json(user);
		} catch (error: unknown) {
			if (error instanceof NotFoundError) {
				res.status(404).json({ error: 'not found' });
				return;
			}

			this.logger.error('get user failed', { error });
			res.status(500).json({ error: 'internal error' });
		}
	}
}
```

### Dependency Wiring

Keep it explicit in the entrypoint.

```typescript
import { createLogger } from './lib/logger';
import { createDatabase } from './lib/database';
import { createUserRepository } from './modules/users/user.repository';
import { UserService } from './modules/users/user.service';
import { UserController } from './modules/users/user.controller';

async function main() {
	const logger = createLogger();
	const db = await createDatabase();

	const userRepo = createUserRepository(db);
	const userService = new UserService(userRepo, logger);
	const userController = new UserController(userService, logger);

	const app = createApp();
	app.get('/users/:id', (req, res) => userController.getUser(req, res));
	app.post('/users', (req, res) => userController.createUser(req, res));

	app.listen(3000, () => {
		logger.info('server started', { port: 3000 });
	});
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
```

## Logging

Structured logging, lowercase messages.

```typescript
type Logger = {
	debug(message: string, meta?: Record<string, unknown>): void;
	info(message: string, meta?: Record<string, unknown>): void;
	warn(message: string, meta?: Record<string, unknown>): void;
	error(message: string, meta?: Record<string, unknown>): void;
};

// Usage
const logger = createLogger('user-service');

logger.info('user created', { userId: '123', email: 'user@example.com' });
logger.error('failed to create user', { error, userId: '123' });
```

## Constants and Enums

Use const objects with `as const`. Avoid TypeScript enums.

```typescript
// PREFERRED: const object with as const (SCREAMING_SNAKE_CASE keys)
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

// ACCEPTABLE: string literal unions for simple cases
type Priority = 'low' | 'medium' | 'high';

// PREFERRED: const object when you need runtime access to values
// (iteration, validation, reverse lookup)
```

## Schema Validation with Zod

Define schema first, infer type. Zod provides runtime validation.

**Zod v4** differences from v3:

- `z.nativeEnum()` is deprecated; use `z.enum()` instead
- `.Enum` and `.Values` are removed

### Enums in Zod v4

```typescript
import { z } from 'zod';

// GOOD: const object + z.enum + .meta()
const PriorityLevel = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
} as const;

type PriorityLevel = (typeof PriorityLevel)[keyof typeof PriorityLevel];

// Extract values for z.enum (requires tuple type assertion)
const priorityLevelValues = Object.values(PriorityLevel) as [PriorityLevel, ...PriorityLevel[]];

// Access values directly
PriorityLevel.LOW; // => "low"

const itemSchema = z
	.object({
		id: z.string().meta({
			description: 'unique identifier',
		}),
		name: z.string().meta({
			description: 'display name',
		}),
	})
	.meta({
		title: 'Item',
		description: 'an item to be prioritized',
	});

type Item = z.infer<typeof itemSchema>;

const priorityResponseSchema = z
	.object({
		item: itemSchema,
		priority: z.enum(priorityLevelValues).meta({
			description: 'priority level',
		}),
	})
	.meta({
		title: 'PriorityResponse',
		description: 'response containing item with assigned priority',
		strict: true, // only on top-level schema for AI structured output
	});

type PriorityResponse = z.infer<typeof priorityResponseSchema>;

// BAD: z.nativeEnum() - deprecated in v4
// z.nativeEnum(SomeEnum);

// BAD: string array - values not reusable
// z.enum(["pending", "active"]);
```

### Schema-First Design

Schema is single source of truth.

```typescript
// Input schemas (partial, for creation/updates)
const createItemSchema = itemSchema.omit({ id: true });
type CreateItemInput = z.infer<typeof createItemSchema>;

const updateItemSchema = createItemSchema.partial();
type UpdateItemInput = z.infer<typeof updateItemSchema>;

// Discriminated unions; use const object values as literals
const ResponseStatus = {
	SUCCESS: 'success',
	ERROR: 'error',
} as const;

type ResponseStatus = (typeof ResponseStatus)[keyof typeof ResponseStatus];

const apiResponseSchema = z.discriminatedUnion('status', [
	z.object({
		status: z.literal(ResponseStatus.SUCCESS),
		data: priorityResponseSchema,
	}),
	z.object({
		status: z.literal(ResponseStatus.ERROR),
		error: z.string().meta({
			description: 'error message',
		}),
	}),
]);

type ApiResponse = z.infer<typeof apiResponseSchema>;

// BAD: defining types separately then trying to validate
// type Item = { id: string; name: string; ... }; // DON'T define types first
// const itemSchema = z.object({...}); // then duplicate in schema
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

// With error handling
function parseItemWithErrors(data: unknown) {
	const result = itemSchema.safeParse(data);

	if (!result.success) {
		logger.error('validation failed', { errors: result.error.flatten() });
		return null;
	}

	return result.data;
}
```

## Development Workflow

### Type Checking

Add to `package.json`:

```json
{
	"scripts": {
		"typecheck": "tsc --noEmit"
	}
}
```

```bash
pnpm typecheck               # type check only
```

**When to use:** During development, pre-commit hooks, CI/CD. Prefer over full build for quick validation.

### Dependency Management

```bash
pnpm add package-name@latest           # add dependency
pnpm add -D package-name@latest        # dev dependency
pnpm update --recursive --latest       # update all (never run unless explicitly asked)
```

### Code Quality

Add to `package.json`:

```json
{
	"scripts": {
		"format:check": "prettier --check .",
		"format": "prettier --write ."
	}
}
```

```bash
pnpm format:check              # check format
pnpm format                    # fix format
pnpm typecheck                 # full check
```

### Linting

Use `@typescript-eslint` to enforce style rules from this guide.

```json
{
	"scripts": {
		"lint": "eslint . --ext .ts,.tsx",
		"lint:fix": "eslint . --ext .ts,.tsx --fix"
	}
}
```

**Key rules that enforce this guide:**

- `@typescript-eslint/no-explicit-any` — prevents `any` usage
- `@typescript-eslint/consistent-type-imports` — enforces `import type`
- `@typescript-eslint/no-unused-vars` — catches dead code
- `@typescript-eslint/prefer-nullish-coalescing` — enforces `??` over `||`
- `@typescript-eslint/no-floating-promises` — catches unhandled async errors

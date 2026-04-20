# ts-template

An opinionated, AI-first TypeScript project template. Batteries included: structured LLM output via [AI SDK](https://ai-sdk.dev), markdown prompt templating, PostgreSQL via [Drizzle](https://orm.drizzle.team), structured logging, and CLI scripting.

## Quick Start

```bash
pnpm install
cp .env.example .env
# edit .env with your OPENROUTER_API_KEY and DATABASE_URL
pnpm dev
```

## Project Structure

```
ts-template/
├── app/                  Next.js App Router (pages, layouts, API routes)
├── lib/
│   ├── ai/               AI SDK utilities (provider, prompts, structured, stream)
│   ├── config/           Zod-validated environment config
│   ├── db/               Drizzle ORM (connection, schema, migrations)
│   ├── concurrency.ts    Bounded parallel execution (p-limit)
│   ├── errors.ts         Application error types
│   ├── log.ts            Pino structured logger
│   └── retry.ts          Exponential backoff with jitter
├── prompts/              Markdown prompt templates
├── scripts/              CLI scripts (run with tsx)
├── Dockerfile            Multi-stage: deps, builder, production
└── compose.yaml          App + opt-in PostgreSQL
```

## Development

| Command          | Description                 |
| ---------------- | --------------------------- |
| `pnpm dev`       | Start Next.js dev server    |
| `pnpm build`     | Production build            |
| `pnpm lint`      | Lint with ESLint            |
| `pnpm lint:fix`  | Lint and apply fixes        |
| `pnpm format`    | Format with Prettier        |
| `pnpm test`      | Run Vitest                  |
| `pnpm typecheck` | Type check without building |
| `pnpm check`     | Typecheck, lint, format     |

### Database

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm db:generate` | Generate migration from schema  |
| `pnpm db:migrate`  | Apply pending migrations        |
| `pnpm db:push`     | Push schema directly (dev only) |
| `pnpm db:studio`   | Open Drizzle Studio GUI         |

Start PostgreSQL locally with Docker:

```bash
docker compose --profile postgres up -d
```

### Scripts

Run CLI scripts with the `script` helper (loads `.env` if present via `--env-file-if-exists`):

```bash
pnpm script scripts/example.ts --input "your text here"
```

Or invoke `tsx` directly if you need different env loading:

```bash
pnpm tsx --env-file=.env scripts/example.ts --input "your text here"
```

### Docker

```bash
docker compose up        # start app (requires built image)
docker compose down      # stop all services
```

## Configuration

Configured via environment variables. Copy `.env.example` to `.env` to get started.

| Variable              | Required | Default       | Description                                                                                   |
| --------------------- | -------- | ------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Yes      | —             | PostgreSQL connection URL                                                                     |
| `OPENROUTER_API_KEY`  | Yes      | —             | OpenRouter API key                                                                            |
| `LOG_LEVEL`           | No       | `info`        | debug, info, warn, error                                                                      |
| `NODE_ENV`            | No       | `development` | development, production, test                                                                 |
| `SKIP_ENV_VALIDATION` | No       | —             | Set to `true` to bypass env validation at startup (CI / `next build` without runtime secrets) |

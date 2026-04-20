import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { z } from 'zod';
import { toJSONSchema } from 'zod/v4/core';

import { env, NodeEnv } from '@/lib/config/env';

const PROMPTS_DIR = join(import.meta.dirname, '../../prompts');
const DIRECTIVE_PATTERN = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

type PromptVars = Record<string, string>;

// cache raw prompt bodies outside development so request handlers don't hit the disk
// on every call. in dev, skipping the cache keeps edits to prompts/*.md live.
const shouldCache = env.NODE_ENV !== NodeEnv.DEVELOPMENT;
const rawPromptCache = new Map<string, string>();

function readPrompt(name: string): string {
	if (shouldCache) {
		const cached = rawPromptCache.get(name);

		if (cached !== undefined) {
			return cached;
		}
	}

	const filePath = join(PROMPTS_DIR, `${name}.md`);
	const content = readFileSync(filePath, 'utf-8');

	if (shouldCache) {
		rawPromptCache.set(name, content);
	}

	return content;
}

// loads a prompt template from prompts/{name}.md and resolves {{DIRECTIVE}} placeholders.
// throws on unresolved directives or unused variables (bidirectional validation).
export function loadPrompt(name: string, vars: PromptVars = {}): string {
	const template = readPrompt(name);
	const usedVars = new Set<string>();

	const content = template.replace(DIRECTIVE_PATTERN, (_match, key: string) => {
		const value = vars[key];

		if (value === undefined) {
			throw new Error(`unresolved directive {{${key}}} in prompt "${name}"`);
		}

		usedVars.add(key);

		return value;
	});

	const unusedVars = Object.keys(vars).filter(k => !usedVars.has(k));

	if (unusedVars.length > 0) {
		throw new Error(`unused vars passed to prompt "${name}": ${unusedVars.join(', ')}`);
	}

	return content;
}

// converts a Zod schema to a JSON Schema fenced code block for prompt injection.
export function schemaBlock(schema: z.ZodType): string {
	const jsonSchema = toJSONSchema(schema);
	const formatted = JSON.stringify(jsonSchema, null, 2);

	return `\`\`\`json\n${formatted}\n\`\`\``;
}

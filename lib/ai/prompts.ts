import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { toJSONSchema, type z } from 'zod';

const PROMPTS_DIR = join(process.cwd(), 'prompts');
const DIRECTIVE_PATTERN = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

type PromptVars = Record<string, string>;

// loads a prompt template from prompts/{name}.md and resolves {{DIRECTIVE}} placeholders.
// throws on unresolved directives or unused variables (bidirectional validation).
export function loadPrompt(name: string, vars: PromptVars = {}): string {
	const filePath = join(PROMPTS_DIR, `${name}.md`);
	let content = readFileSync(filePath, 'utf-8');

	const usedVars = new Set<string>();

	content = content.replace(DIRECTIVE_PATTERN, (_match, key: string) => {
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

// converts a Zod schema to a JSON Schema fenced code block for prompt injection.
export function schemaBlock(schema: z.ZodType): string {
	const jsonSchema = toJSONSchema(schema);
	const formatted = JSON.stringify(jsonSchema, null, 2);

	return ['```json', formatted, '```'].join('\n');
}

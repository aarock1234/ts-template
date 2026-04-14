// Example CLI script demonstrating the standard pattern.
// Run with: pnpm tsx scripts/example.ts --input "your text here"

import { parseArgs } from 'node:util';

import type { ModelMessage } from 'ai';
import { z } from 'zod';

import { createModel, reasoning } from '@/lib/ai/client';
import { structured } from '@/lib/ai/structured';
import { loadPrompt, schemaBlock } from '@/lib/ai/prompts';
import { loadConfig } from '@/lib/config';
import { createLogger } from '@/lib/logger';

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
	},
	strict: true,
} as const;

const summarySchema = z
	.object({
		title: z.string().meta({
			description: 'a brief title for the document',
		}),
		summary: z.string().meta({
			description: 'a 2-3 sentence summary',
		}),
		keyPoints: z.array(z.string()).meta({
			description: 'the main points as a list',
		}),
	})
	.meta({
		title: 'DocumentSummary',
		description: 'a structured summary of a document',
		strict: true,
	});

async function run(signal: AbortSignal): Promise<void> {
	const config = loadConfig();
	const log = createLogger('example', config.LOG_LEVEL);
	const { values } = parseArgs(parseOptions);
	const input = values.input;
	const modelId = typeof values.model === 'string' ? values.model : 'google/gemini-3-flash-preview';

	if (typeof input !== 'string' || input.length === 0) {
		throw new Error('--input is required');
	}

	const startContext = { input, model: modelId };
	log.info('starting', startContext);
	const promptVars = { RESPONSE_SCHEMA: schemaBlock(summarySchema) };
	const system = loadPrompt('example', promptVars);
	const messages: ModelMessage[] = [
		{
			role: 'user',
			content: input,
		},
	];
	const structuredOptions = {
		model: createModel(modelId),
		system,
		messages,
		providerOptions: reasoning.off,
		signal,
	};

	const result = await structured(summarySchema, structuredOptions);
	const resultContext = { result };

	log.info('done', resultContext);
	console.log(JSON.stringify(result, null, 2));
}

const controller = new AbortController();

process.on('SIGINT', () => controller.abort());
process.on('SIGTERM', () => controller.abort());

run(controller.signal).catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});

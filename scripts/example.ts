// Example CLI script demonstrating the standard pattern.
// Run with: pnpm tsx scripts/example.ts --input "your text here"

import { parseArgs } from 'node:util';

import type { ModelMessage } from 'ai';
import { z } from 'zod';

import { openrouter, providerOptions } from '@/lib/ai/provider';
import { loadPrompt, schemaBlock } from '@/lib/ai/prompts';
import { structured } from '@/lib/ai/structured';
import { logger } from '@/lib/log';

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
	const { values } = parseArgs(parseOptions);

	if (!values.input) {
		throw new Error('--input is required');
	}

	const childContext = { script: 'example' };
	const log = logger.child(childContext);
	const modelId = values.model ?? 'google/gemini-3-flash-preview';

	const startContext = {
		input: values.input,
		model: modelId,
	};
	log.info(startContext, 'starting');

	const promptVars = { RESPONSE_SCHEMA: schemaBlock(summarySchema) };
	const system = loadPrompt('example', promptVars);
	const messages: ModelMessage[] = [
		{
			role: 'user',
			content: values.input,
		},
	];
	const structuredOptions = {
		model: openrouter(modelId),
		system,
		messages,
		providerOptions: providerOptions.reasoningOff,
		abortSignal: signal,
	};

	const result = await structured(summarySchema, structuredOptions);
	const resultContext = { result };

	log.info(resultContext, 'done');
	console.log(JSON.stringify(result, null, 2));
}

const controller = new AbortController();

process.on('SIGINT', () => controller.abort());
process.on('SIGTERM', () => controller.abort());

run(controller.signal).catch((error: unknown) => {
	const context = { err: error };
	logger.error(context, 'script failed');
	process.exit(1);
});

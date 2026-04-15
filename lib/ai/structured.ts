import { generateText, Output } from 'ai';
import type { CallSettings, LanguageModel, Prompt } from 'ai';
import type { ProviderOptions } from '@ai-sdk/provider-utils';
import type { z } from 'zod';

import { retry } from '@/lib/retry';

type StructuredOptions = CallSettings &
	Prompt & {
		model: LanguageModel;
		providerOptions?: ProviderOptions;
		retries?: number;
	};

// generates structured output from an LLM using a Zod schema.
// wraps generateText + Output.object with retry, null-output handling,
// and Zod re-validation for type safety.
export async function structured<T extends z.ZodType>(schema: T, options: StructuredOptions): Promise<z.infer<T>> {
	const { retries = 2, ...generateParams } = options;

	const retryOptions = {
		maxAttempts: retries + 1,
		signal: generateParams.abortSignal,
	};

	const outputConfig = {
		schema,
		name: schema.meta()?.title,
		description: schema.meta()?.description,
	};

	const output = Output.object(outputConfig);

	return retry(async () => {
		const generateOptions = { ...generateParams, output };
		const result = await generateText(generateOptions);

		if (!result.output) {
			throw new Error('model returned no structured output');
		}

		return schema.parse(result.output);
	}, retryOptions);
}

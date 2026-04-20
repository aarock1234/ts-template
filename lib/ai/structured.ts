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
// wraps generateText + Output.object with retry and a null-output guard.
// Output.object already validates against the schema, so no second parse is needed.
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
	const generateOptions = { ...generateParams, output };

	return retry(async () => {
		const result = await generateText(generateOptions);

		if (!result.output) {
			throw new Error('model returned no structured output');
		}

		return result.output as z.infer<T>;
	}, retryOptions);
}

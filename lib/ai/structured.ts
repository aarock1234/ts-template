import { type LanguageModel, type ModelMessage, generateText, Output } from 'ai';
import type { ProviderOptions } from '@ai-sdk/provider-utils';
import type { z } from 'zod';

import { retry } from '@/lib/retry';

type StructuredOptions = {
	model: LanguageModel;
	system?: string;
	providerOptions?: ProviderOptions;
	retries?: number;
	signal?: AbortSignal;
} & ({ prompt: string; messages?: never } | { messages: ModelMessage[]; prompt?: never });

// generates structured output from an LLM using a Zod schema.
// wraps generateText + Output.object with retry, null-output handling,
// and Zod re-validation to avoid type assertions.
export async function structured<T extends z.ZodType>(schema: T, options: StructuredOptions): Promise<z.infer<T>> {
	const { retries = 2, signal, ...rest } = options;
	const retryOptions = { maxAttempts: retries + 1, signal };
	const outputConfig = { schema };
	const output = Output.object(outputConfig);

	return retry(async () => {
		const generateOptions = { ...rest, output };
		const result = await generateText(generateOptions);

		if (!result.output) {
			throw new Error('model returned no structured output');
		}

		return schema.parse(result.output);
	}, retryOptions);
}

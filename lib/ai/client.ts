import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';

import { loadConfig } from '@/lib/config';

let provider: ReturnType<typeof createOpenRouter> | undefined;

function getProvider(): ReturnType<typeof createOpenRouter> {
	if (!provider) {
		const config = loadConfig();
		const providerOptions = { apiKey: config.OPENROUTER_API_KEY };
		provider = createOpenRouter(providerOptions);
	}

	return provider;
}

export function createModel(id: string): LanguageModel {
	return getProvider()(id);
}

export const reasoning = {
	off: { openrouter: { reasoning: { enabled: false, exclude: false, effort: 'none' } } },
	low: { openrouter: { reasoning: { enabled: true, exclude: true, effort: 'low' } } },
	high: { openrouter: { reasoning: { enabled: true, exclude: true, effort: 'high' } } },
} as const;

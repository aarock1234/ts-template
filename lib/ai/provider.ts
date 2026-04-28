import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { ProviderOptions } from '@ai-sdk/provider-utils';

import { env } from '@/lib/config/env';
import { assertServerOnly } from '@/lib/server-only';

assertServerOnly('lib/ai/provider');

export const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
});

export const providerOptions = {
	reasoningOff: {
		openrouter: {
			reasoning: {
				enabled: false,
				exclude: false,
				effort: 'none',
			},
		},
	},
	reasoningLow: {
		openrouter: {
			reasoning: {
				enabled: true,
				exclude: true,
				effort: 'low',
			},
		},
	},
	reasoningHigh: {
		openrouter: {
			reasoning: {
				enabled: true,
				exclude: true,
				effort: 'high',
			},
		},
	},
} as const satisfies Record<string, ProviderOptions>;

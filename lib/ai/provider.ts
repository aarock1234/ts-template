import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { env } from '@/lib/config/env';

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
} as const;

import { streamText } from 'ai';
import type { CallSettings, LanguageModel, Prompt, Tool } from 'ai';
import type { ProviderOptions } from '@ai-sdk/provider-utils';

type StreamOptions = CallSettings &
	Prompt & {
		model: LanguageModel;
		tools?: Record<string, Tool>;
		providerOptions?: ProviderOptions;
	};

// thin wrapper around streamText — exists for symmetry with structured()
// and a single place to layer in defaults (logging, instrumentation, etc.).
export function stream(options: StreamOptions) {
	return streamText(options);
}

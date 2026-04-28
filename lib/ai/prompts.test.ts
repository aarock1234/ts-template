import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadPrompt', () => {
	let previousSkipEnvValidation: string | undefined;

	beforeEach(() => {
		previousSkipEnvValidation = process.env.SKIP_ENV_VALIDATION;
		process.env.SKIP_ENV_VALIDATION = 'true';
		vi.resetModules();
	});

	afterEach(() => {
		if (previousSkipEnvValidation === undefined) {
			delete process.env.SKIP_ENV_VALIDATION;
		} else {
			process.env.SKIP_ENV_VALIDATION = previousSkipEnvValidation;
		}
	});

	it('loads a prompt and resolves directives', async () => {
		const { loadPrompt } = await import('@/lib/ai/prompts');
		const vars = { RESPONSE_SCHEMA: '{"type":"object"}' };

		const result = loadPrompt('example', vars);

		expect(result).toContain('{"type":"object"}');
		expect(result).not.toContain('{{RESPONSE_SCHEMA}}');
	});

	it('throws when a directive is unresolved', async () => {
		const { loadPrompt } = await import('@/lib/ai/prompts');

		expect(() => loadPrompt('example')).toThrow('unresolved directive {{RESPONSE_SCHEMA}}');
	});

	it('throws when variables are unused', async () => {
		const { loadPrompt } = await import('@/lib/ai/prompts');
		const vars = {
			RESPONSE_SCHEMA: '{"type":"object"}',
			UNUSED: 'value',
		};

		expect(() => loadPrompt('example', vars)).toThrow('unused vars passed to prompt "example": UNUSED');
	});
});

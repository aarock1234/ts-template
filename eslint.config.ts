import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const rootDir = dirname(fileURLToPath(import.meta.url));

const parserOptions = {
	projectService: true,
	tsconfigRootDir: rootDir,
};

const config = [
	{
		ignores: ['.next/**', 'coverage/**', 'next-env.d.ts', 'node_modules/**', 'lib/db/migrations/**'],
	},
	...nextCoreWebVitals,
	...nextTypeScript,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/switch-exhaustiveness-check': 'error',
			'@typescript-eslint/require-await': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
];

export default config;

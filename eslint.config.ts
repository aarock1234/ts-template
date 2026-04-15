import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';

const rootDir = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
	baseDirectory: rootDir,
});
const parserOptions = {
	projectService: true,
	tsconfigRootDir: rootDir,
};

const config = [
	{
		ignores: ['.next/**', 'next-env.d.ts', 'node_modules/**', 'lib/db/migrations/**'],
	},
	...compat.extends('next/core-web-vitals', 'next/typescript'),
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
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
];

export default config;

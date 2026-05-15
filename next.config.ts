import type { NextConfig } from 'next';

const config: NextConfig = {
	output: 'standalone',
	// loadPrompt() reads from prompts/*.md at runtime via readFileSync. Next.js's file
	// tracer doesn't follow dynamic fs reads, so we include the markdown files explicitly
	// for standalone deployments (Vercel, fly.io, etc.). The Dockerfile copies the
	// directory separately and doesn't strictly need this, but having it here is cheaper
	// than discovering it's missing in production.
	outputFileTracingIncludes: {
		'/**': ['./prompts/**/*.md'],
	},
};

export default config;

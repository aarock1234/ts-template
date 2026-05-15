// runtime guard for server-only modules. preferred over `import 'server-only'`
// because that package throws on import outside the react-server condition,
// which would break tsx scripts that share `lib/` with the Next.js app.
export function assertServerOnly(moduleName: string): void {
	if (typeof window !== 'undefined') {
		throw new Error(`${moduleName} can only be used in a server runtime`);
	}
}

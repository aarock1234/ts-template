import { sql } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
	const log = createLogger('health');
	const heartbeatQuery = sql`SELECT 1`;

	try {
		const db = getDb();
		await db.execute(heartbeatQuery);
		const body = { status: 'ok' };

		return Response.json(body);
	} catch (error: unknown) {
		const context = { error };
		const body = { status: 'error' };

		log.error('health check failed', context);

		return Response.json(body, { status: 503 });
	}
}

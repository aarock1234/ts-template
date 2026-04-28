import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
	const heartbeatQuery = sql`SELECT 1`;

	try {
		await db.execute(heartbeatQuery);

		return Response.json({ status: 'ok' });
	} catch (error) {
		logger.error({ err: error }, 'health check failed');

		return Response.json({ status: 'error' }, { status: 503 });
	}
}

import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
	const heartbeatQuery = sql`SELECT 1`;

	try {
		await db.execute(heartbeatQuery);

		const body = { status: 'ok' };

		return Response.json(body);
	} catch (error) {
		const context = { err: error };
		logger.error(context, 'health check failed');

		const body = { status: 'error' };
		const responseOptions = { status: 503 };

		return Response.json(body, responseOptions);
	}
}

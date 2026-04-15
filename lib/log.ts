import pino from 'pino';

import { env } from '@/lib/config/env';
import { NodeEnv } from '@/lib/config/env';

export const logger = pino({
	level: env.LOG_LEVEL,
	...(env.NODE_ENV === NodeEnv.Development && {
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'SYS:standard',
			},
		},
	}),
});

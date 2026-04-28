import pino from 'pino';

import { env, NodeEnv } from '@/lib/config/env';
import { assertServerOnly } from '@/lib/server-only';

assertServerOnly('lib/log');

const prettyTransport = {
	target: 'pino-pretty',
	options: {
		translateTime: 'SYS:standard',
	},
};

export const logger = pino({
	level: env.LOG_LEVEL,
	...(env.NODE_ENV === NodeEnv.DEVELOPMENT && {
		transport: prettyTransport,
	}),
});

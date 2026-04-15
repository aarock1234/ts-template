import pino from 'pino';

import { loadConfig, type Config } from '@/lib/config';

type LogMeta = Record<string, unknown>;

export type Logger = {
	debug(message: string, meta?: LogMeta): void;
	info(message: string, meta?: LogMeta): void;
	warn(message: string, meta?: LogMeta): void;
	error(message: string, meta?: LogMeta): void;
};

export function createLogger(name: string, level?: Config['LOG_LEVEL']): Logger {
	const config = loadConfig();
	const resolvedLevel = level ?? config.LOG_LEVEL;
	const isDevelopment = config.NODE_ENV === 'development';
	const transport = isDevelopment ? { target: 'pino-pretty' } : undefined;
	const loggerOptions = transport ? { name, level: resolvedLevel, transport } : { name, level: resolvedLevel };
	const baseLogger = pino(loggerOptions);

	function debug(message: string, meta?: LogMeta): void {
		if (meta) {
			baseLogger.debug(meta, message);
			return;
		}

		baseLogger.debug(message);
	}

	function info(message: string, meta?: LogMeta): void {
		if (meta) {
			baseLogger.info(meta, message);
			return;
		}

		baseLogger.info(message);
	}

	function warn(message: string, meta?: LogMeta): void {
		if (meta) {
			baseLogger.warn(meta, message);
			return;
		}

		baseLogger.warn(message);
	}

	function error(message: string, meta?: LogMeta): void {
		if (meta) {
			baseLogger.error(meta, message);
			return;
		}

		baseLogger.error(message);
	}

	return {
		debug,
		info,
		warn,
		error,
	};
}

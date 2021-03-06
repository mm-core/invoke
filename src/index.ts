import { constants, promises as fs } from 'fs';
import { join } from 'path';
import anylogger from 'anylogger';
import config from '@mmstudio/config';

const logger = anylogger('invoke');

async function resolve_path(file_name: string, path: string) {
	// !!! We could not use require.resolve here, because electron does not support.
	const full_path = join(path, `${file_name}.js`);
	await fs.access(full_path, constants.F_OK);
	return full_path;
}

export default async function invoke<T>(service: string, content: unknown, actionid: string) {
	const cwd = config.cwd;
	const tm = new Date().getTime();
	logger.info(`Begin dealing message, service=${service}`);
	const body = JSON.stringify(content);
	try {
		logger.debug(`Begin dealing message, body=${body}, actionid=${actionid}`);
		const file_name = service;
		logger.debug(`trying get service file:${file_name}, actionid=${actionid}`);
		const path = await (async () => {
			try {
				// !!! await added here to get exception
				return await resolve_path(file_name, join(cwd, 'dist'));
			} catch (error) {
				logger.trace(error);
				logger.error(`Could not load service:${file_name}`);
				throw new Error(`Could not load service:${file_name}`);
			}
		})();
		if (config.debug) {
			delete (require.cache as { [key: string]: unknown })[path];
		}
		// eslint-disable-next-line import/no-dynamic-require
		const atom = (require(path) as { default(c: unknown, a: string): Promise<T> });
		return await atom.default(content, actionid);
	} catch (e) {
		const err = e as Error;
		logger.trace(err);
		const err_msg = err.message;
		logger.error(`Service Error:${err_msg},`);
		throw new Error(err_msg);
	} finally {
		const cost = new Date().getTime() - tm;
		logger.debug(`End dealing service:${service}, Message body=[${body}], ${cost}ms cost,, actionid=${actionid}`);
		if (cost > 500) {
			logger.error(`Service cost ${cost} ms, please check the service! Message body=[${body}], actionid=${actionid}`);
		} else if (cost > 200) {
			logger.warn(`Service cost ${cost} ms, maybe you should please check the service! Message body=[${body}], actionid=${actionid}`);
		}
	}
}

import { logger } from '@lark-apaas/client-toolkit/logger';
/* eslint-disable no-console */
const PREFIX = '[心系]';

const info = (...args: unknown[]): void => {
  logger.info(PREFIX, String(...args));
};

const warn = (...args: unknown[]): void => {
  logger.warn(PREFIX, String(...args));
};

const error = (...args: unknown[]): void => {
  logger.error(PREFIX, String(...args));
};

const debug = (...args: unknown[]): void => {
  logger.debug(PREFIX, String(...args));
};

export const appLogger = { info, warn, error, debug };

export default appLogger;

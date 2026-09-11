import { logger } from '@lark-apaas/client-toolkit/logger';
const PREFIX = '[心系]';

export const appLogger = {
  info(...args: unknown[]) {
    // eslint-disable-next-line no-console
    logger.info(PREFIX, String(...args));
  },
  warn(...args: unknown[]) {
    // eslint-disable-next-line no-console
    logger.warn(PREFIX, String(...args));
  },
  error(...args: unknown[]) {
    // eslint-disable-next-line no-console
    logger.error(PREFIX, String(...args));
  },
  debug(...args: unknown[]) {
    // eslint-disable-next-line no-console
    logger.debug(PREFIX, String(...args));
  },
};

export default appLogger;

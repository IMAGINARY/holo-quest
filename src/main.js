import { logger } from './lib/helpers/logger';
import { installFatalErrorHandler } from './lib/helpers-web/show-fatal-error';

installFatalErrorHandler();
logger.info('Hello World!');

import * as Sentry from '@sentry/browser';
import { logger } from './logger';

let sentryInitialized = false;

export default function initSentry(sentryDSN) {
  if (sentryInitialized) {
    logger.debug('Sentry already initialized, skipping.');
    return false;
  }

  Sentry.init({
    dsn: sentryDSN,
    release: process.env.GIT_COMMIT_HASH || 'unknown',
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
    transportOptions: {
    },
    integrations: [
      Sentry.captureConsoleIntegration({
        // array of methods that should be captured
        // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
        levels: ['error'],
      }),
    ],
    // Disable traces, replays and profiling
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    profilesSampleRate: 0,
  });

  sentryInitialized = true;
  logger.info('Sentry initialized with DSN: %s', sentryDSN);
  return true;
}

import yaml from 'js-yaml';
import { installFatalErrorHandler } from '../helpers-web/show-fatal-error';
import { logger } from '../helpers/logger';
import initSentry from '../helpers/sentry';
import CfgLoader from '../loaders/cfg-loader';
import CfgReaderFetch from '../loaders/cfg-reader-fetch';
import configFiles from './inject-config-files';

export default async function initStandaloneApp() {
  const qs = new URLSearchParams(window.location.search);

  installFatalErrorHandler();

  const logLevel = qs.get('log') || 'warn';
  logger.setLevel(logLevel);

  // Phase 1: Initialize Sentry early from query string to capture config-loading errors
  const sentryDsn = qs.get('sentry_dsn');
  if (sentryDsn) {
    initSentry(sentryDsn);
  }

  // Accept a settings url param with comma-separated filenames. Each name must be made of
  // alphanumeric characters, _ or -, and have a .yml extension.
  const VALID_SETTINGS_RE = /^[a-zA-Z0-9_-]+\.yml$/;
  let settingsFiles = ['settings.yml'];
  const settingsParam = qs.get('settings');
  if (settingsParam) {
    const validated = settingsParam.split(',').filter((name) => {
      if (!name.match(VALID_SETTINGS_RE)) {
        logger.warn('Invalid settings file name ignored: "%s". Use only alphanumeric characters, _ or -, with .yml extension.', name);
        return false;
      }
      return true;
    });
    if (validated.length > 0) {
      settingsFiles = validated;
    }
  }

  const cfgLoader = new CfgLoader(CfgReaderFetch, yaml.load);

  let config;
  try {
    logger.debug('Loading configuration files: %s', configFiles.join(', '));
    logger.debug('Loading settings files: %s', settingsFiles.join(', '));
    config = await cfgLoader.load([
      ...configFiles.map((name) => `config/${name}.yml`),
      ...settingsFiles,
    ]);
    Object.freeze(config);
    logger.debug('Configuration loaded successfully', config);
  } catch (err) {
    throw new Error(`Error loading configuration: ${err.message}`);
  }

  // Phase 2: Initialize Sentry from config (no-op if already initialized from query string)
  if (config.sentry && config.sentry.dsn) {
    initSentry(config.sentry.dsn);
  }

  return { config };
}

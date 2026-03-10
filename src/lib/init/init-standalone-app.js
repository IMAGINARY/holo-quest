import deepmerge from 'deepmerge';
import yaml from 'js-yaml';
import { installFatalErrorHandler } from '../helpers-web/show-fatal-error';
import { logger } from '../helpers/logger';
import initSentry from '../helpers/sentry';
import CfgLoader from '../loaders/cfg-loader';
import CfgReaderFetch from '../loaders/cfg-reader-fetch';
import configFiles from './inject-config-files';
import getQsConfigOverrides from './init-qs-config-overrides';

/**
 * Parse and validate the 'settings' query string parameter.
 *
 * @param {URLSearchParams} qs
 * @return {string[]|*}
 */
function parseSettingsFiles(qs) {
  const VALID_SETTINGS_RE = /^[a-zA-Z0-9_-]+\.yml$/;
  const settingsParam = qs.get('settings');
  if (!settingsParam) {
    return [];
  }
  const validated = settingsParam.split(',').filter((name) => {
    if (!name.match(VALID_SETTINGS_RE)) {
      logger.warn('Invalid settings file name ignored: "%s". Use only alphanumeric characters, _ or -, with .yml extension.', name);
      return false;
    }
    return true;
  });
  return validated.length > 0 ? validated : [];
}

/**
 * Load configuration and settings files.
 *
 * @param {string[]} settingsFiles
 * @return {Promise<Object>} Resolved configuration object
 */
async function loadConfig(settingsFiles, overrides = {}) {
  const cfgLoader = new CfgLoader(CfgReaderFetch, yaml.load);
  try {
    logger.debug('Loading configuration files: %s', configFiles.join(', '));
    logger.debug('Loading settings files: %s', settingsFiles.join(', '));
    let config = await cfgLoader.load([
      ...configFiles.map((name) => `config/${name}.yml`),
      ...settingsFiles,
    ]);
    Object.entries(overrides).forEach(([source, override]) => {
      logger.debug('Applying config override from: %s', source);
      config = deepmerge(config, override);
    });
    Object.freeze(config);
    logger.debug('Configuration loaded successfully', config);
    return config;
  } catch (err) {
    throw new Error(`Error loading configuration: ${err.message}`);
  }
}

/**
 * Initialize basic app services for a standalone (non-client-server) environment, including:
 *
 * - Fatal error handling
 * - Logging (with log level from query string)
 * - Configuration loading (from config files and settings files specified in query string)
 * - Sentry initialization (with DSN from query string or config)
 *
 * @return {Promise<{config: Object}>}
 */
export default async function initStandaloneApp() {
  const qs = new URLSearchParams(window.location.search);

  installFatalErrorHandler();

  const logLevel = qs.get('log') || 'warn';
  logger.setLevel(logLevel);

  // Phase 1: Initialize Sentry early from the query string to capture config-loading errors
  const sentryDsn = qs.get('sentry_dsn');
  if (sentryDsn) {
    initSentry(sentryDsn);
  }

  const overrides = getQsConfigOverrides(qs);

  const settingsFiles = parseSettingsFiles(qs);
  const config = await loadConfig(settingsFiles, overrides);

  // Phase 2: Initialize Sentry from the config (no-op if already initialized from query string)
  if (config.sentry && config.sentry.dsn) {
    initSentry(config.sentry.dsn);
  }

  return { config };
}

import { createWriteClient, contentVersionOf } from '@imaginary-maths/nachbarin-client';
import { logger } from '../helpers/logger';

/**
 * Builds the logging callbacks for a Nachbarin write client.
 *
 * The client has no "connected" event: it queues records and drains the queue in the background.
 * Its connection state is inferred instead — a `flush_failed` diagnostic means the service is
 * unreachable (or refusing us), and the next delivered record means it is reachable again.
 *
 * Neither callback ever receives visitor data, so everything they get is safe to log.
 *
 * @return {{onDiagnostic: function(Object): void, onResult: function(Object): void}}
 */
function createLoggingCallbacks() {
  let failing = false;

  const onDiagnostic = (event) => {
    switch (event.type) {
      case 'flush_failed':
        failing = true;
        logger.warn(
          'Nachbarin: sending failed (%s, status %s, code %s: %s); attempt %d, retrying in %ds',
          event.reason,
          event.status ?? '-',
          event.code ?? '-',
          event.detail,
          event.failures,
          Math.round(event.nextAttemptInMs / 1000)
        );
        break;
      case 'records_evicted':
        logger.warn('Nachbarin: %d queued record(s) dropped unsent (%s limit)', event.count, event.reason);
        break;
      case 'storage_write_failed':
        logger.error('Nachbarin: could not persist the queue (%s); unsent records may be lost on reload', event.detail);
        break;
      case 'storage_not_persistent':
        logger.warn('Nachbarin: no persistent storage; unsent records will be lost on reload');
        break;
      case 'id_source':
        logger.debug('Nachbarin: record ids minted with %s', event.source);
        break;
      default:
        logger.debug('Nachbarin: diagnostic %s', event.type);
    }
  };

  const onResult = (outcome) => {
    switch (outcome.status) {
      case 'created':
      case 'duplicate':
        if (failing) {
          failing = false;
          logger.info('Nachbarin: connection restored');
        }
        logger.info('Nachbarin: record %s delivered (%s)', outcome.clientId, outcome.status);
        break;
      case 'rejected':
        logger.error(
          'Nachbarin: record %s rejected by the service (%s: %s)',
          outcome.clientId,
          outcome.error ?? '-',
          outcome.message ?? ''
        );
        break;
      case 'evicted':
        logger.warn('Nachbarin: record %s dropped unsent (%s limit)', outcome.clientId, outcome.reason);
        break;
      default:
        logger.debug('Nachbarin: record %s outcome %s', outcome.clientId, outcome.status);
    }
  };

  return { onDiagnostic, onResult };
}

/**
 * Creates the Nachbarin write client that captured flags are sent to, if Nachbarin is configured.
 *
 * Nachbarin is used only when both `nachbarin.url` and `nachbarin.apiKey` are set (the key can
 * come from the `nachbarin_apiKey` query string). Records carry `nachbarin.engineVersion` as their
 * engine version and a SHA-256 of the story file's text as their content version, so data readers
 * can match each record to the story script that produced it.
 *
 * Never throws: any failure is logged and leaves Nachbarin disabled, so the kiosk still runs.
 * The API key is never logged.
 *
 * Call once per page: the library refuses a second live client on the same queue.
 *
 * @param {Object} config Resolved app configuration.
 * @param {string} storyText The story file's text, exactly as fetched.
 * @return {Promise<{client: Object, onResult: function(Object): void}|null>} The client and the
 *  per-record result logger to pass to `client.write()`, or `null` if Nachbarin is not used.
 */
export default async function initNachbarin(config, storyText) {
  const { url, apiKey, engineVersion } = config.nachbarin ?? {};

  const missing = [!url && 'url', !apiKey && 'apiKey'].filter(Boolean);
  if (missing.length > 0) {
    logger.info('Nachbarin: disabled (no %s configured); captured flags will not be sent', missing.join(' or '));
    return null;
  }
  logger.info('Nachbarin: enabled, sending captured flags to %s', url);

  let contentVersion;
  try {
    contentVersion = await contentVersionOf(storyText);
  } catch (e) {
    logger.error('Nachbarin: could not hash the story for its content version (%s); Nachbarin disabled', e.message);
    return null;
  }

  const { onDiagnostic, onResult } = createLoggingCallbacks();
  let client;
  try {
    client = createWriteClient({
      baseUrl: url,
      apiKey,
      engineVersion,
      contentVersion,
      fetch: window.fetch.bind(window),
      onDiagnostic,
    });
  } catch (e) {
    logger.error('Nachbarin: could not create the client (%s); Nachbarin disabled', e.message);
    return null;
  }

  logger.info('Nachbarin: client ready (engine %s, content %s)', engineVersion, contentVersion);
  const { queued } = client.state();
  if (queued > 0) {
    logger.info('Nachbarin: %d record(s) left from a previous session, resending', queued);
  }

  return { client, onResult };
}

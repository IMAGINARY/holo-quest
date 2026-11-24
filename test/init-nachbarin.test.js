import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import logger from 'loglevel';
import { createWriteClient, contentVersionOf } from '@imaginary-maths/nachbarin-client';
import initNachbarin from '../src/lib/init/init-nachbarin';

vi.mock('@imaginary-maths/nachbarin-client', () => ({
  createWriteClient: vi.fn(),
  contentVersionOf: vi.fn(),
}));

const API_KEY = 'secret-write-key';
const CONTENT_VERSION = `sha256:${'a'.repeat(64)}`;

function makeConfig(nachbarin) {
  return {
    nachbarin: {
      url: 'https://nachbarin.example.org/',
      apiKey: API_KEY,
      engineVersion: '1.0.0',
      ...nachbarin,
    },
  };
}

function allLogged() {
  return [logger.debug, logger.info, logger.warn, logger.error]
    .flatMap((spy) => spy.mock.calls.flat())
    .map(String);
}

describe('initNachbarin', () => {
  let client;

  beforeEach(() => {
    ['debug', 'info', 'warn', 'error'].forEach((level) => {
      vi.spyOn(logger, level).mockImplementation(() => {});
    });
    client = { write: vi.fn(), state: vi.fn(() => ({ queued: 0 })) };
    createWriteClient.mockReset().mockReturnValue(client);
    contentVersionOf.mockReset().mockResolvedValue(CONTENT_VERSION);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be disabled when there is no API key', async () => {
    const result = await initNachbarin(makeConfig({ apiKey: undefined }), 'story');

    expect(result).to.equal(null);
    expect(createWriteClient).not.toHaveBeenCalled();
    expect(allLogged().some((s) => s.includes('disabled'))).to.equal(true);
  });

  it('should be disabled when there is no URL', async () => {
    const result = await initNachbarin(makeConfig({ url: '' }), 'story');

    expect(result).to.equal(null);
    expect(createWriteClient).not.toHaveBeenCalled();
  });

  it('should be disabled when there is no nachbarin config at all', async () => {
    expect(await initNachbarin({}, 'story')).to.equal(null);
  });

  it('should create a client with the configured endpoint, key and versions', async () => {
    const result = await initNachbarin(makeConfig(), 'story text');

    expect(contentVersionOf).toHaveBeenCalledWith('story text');
    expect(createWriteClient).toHaveBeenCalledTimes(1);
    const options = createWriteClient.mock.calls[0][0];
    expect(options).to.include({
      baseUrl: 'https://nachbarin.example.org/',
      apiKey: API_KEY,
      engineVersion: '1.0.0',
      contentVersion: CONTENT_VERSION,
    });
    expect(options.fetch).to.be.a('function');
    expect(options.onDiagnostic).to.be.a('function');
    expect(result.client).to.equal(client);
    expect(result.onResult).to.be.a('function');
  });

  it('should be disabled, and log an error, when the story cannot be hashed', async () => {
    contentVersionOf.mockRejectedValue(new Error('crypto.subtle is unavailable'));

    const result = await initNachbarin(makeConfig(), 'story');

    expect(result).to.equal(null);
    expect(createWriteClient).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should be disabled, and log an error, when the client cannot be created', async () => {
    createWriteClient.mockImplementation(() => { throw new Error('engineVersion is empty'); });

    const result = await initNachbarin(makeConfig({ engineVersion: '' }), 'story');

    expect(result).to.equal(null);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should log diagnostics at matching levels', async () => {
    await initNachbarin(makeConfig(), 'story');
    const { onDiagnostic } = createWriteClient.mock.calls[0][0];

    onDiagnostic({
      type: 'flush_failed',
      reason: 'network',
      status: null,
      code: null,
      detail: 'Failed to fetch',
      failures: 1,
      nextAttemptInMs: 1000,
    });
    expect(logger.warn).toHaveBeenCalledTimes(1);

    onDiagnostic({ type: 'storage_write_failed', detail: 'quota' });
    expect(logger.error).toHaveBeenCalledTimes(1);

    onDiagnostic({ type: 'id_source', source: 'crypto.randomUUID' });
    expect(logger.debug).toHaveBeenCalled();
  });

  it('should log that the connection is restored after a failure', async () => {
    const { onResult } = await initNachbarin(makeConfig(), 'story');
    const { onDiagnostic } = createWriteClient.mock.calls[0][0];

    onResult({ status: 'created', clientId: 'a' });
    expect(allLogged().some((s) => s.includes('restored'))).to.equal(false);

    onDiagnostic({
      type: 'flush_failed',
      reason: 'status',
      status: 503,
      code: 'unavailable',
      detail: '',
      failures: 1,
      nextAttemptInMs: 1000,
    });
    onResult({ status: 'created', clientId: 'b' });
    expect(allLogged().some((s) => s.includes('restored'))).to.equal(true);
  });

  it('should log rejected records as errors', async () => {
    const { onResult } = await initNachbarin(makeConfig(), 'story');

    onResult({
      status: 'rejected', clientId: 'a', error: 'invalid_field', message: 'bad',
    });

    expect(logger.error).toHaveBeenCalled();
  });

  it('should never log the API key', async () => {
    const { onResult } = await initNachbarin(makeConfig(), 'story');
    onResult({ status: 'created', clientId: 'a' });

    expect(allLogged().some((s) => s.includes(API_KEY))).to.equal(false);
  });
});

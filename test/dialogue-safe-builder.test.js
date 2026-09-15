import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import logger from 'loglevel';
import safeBuildDialogue from '../src/lib/model/dialogues/dialogue-safe-builder';
import captureDialogue from './fixtures/dialogues/core/capture.dialogue.json';
import invalidCaptureNoFlagsDialogue
  from './fixtures/dialogues/invalid/invalid-capture-no-flags.dialogue.json';

describe('safeBuildDialogue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should keep root-level properties such as capture', () => {
    const dialogue = safeBuildDialogue(captureDialogue);
    expect(dialogue.root.capture).to.deep.equal(captureDialogue.capture);
    expect(dialogue.statementNodes[0].text).to.equal('Hello world!');
  });

  it('should log a validation error and return a placeholder if capture is invalid', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const dialogue = safeBuildDialogue(invalidCaptureNoFlagsDialogue);
    const loggedCaptureError = errorSpy.mock.calls
      .some(([message]) => typeof message === 'string' && message.includes('/capture'));
    expect(loggedCaptureError).to.equal(true);
    expect(dialogue.root.capture).to.equal(undefined);
    expect(dialogue.statementNodes[0].text).to.equal('...');
  });
});

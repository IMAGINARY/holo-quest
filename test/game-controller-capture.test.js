import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import logger from 'loglevel';
import GameController from '../src/lib/game/game-controller';
import FlagStore from '../src/lib/model/flag-store';
import DialogueIteratorContext from '../src/lib/model/dialogues/dialogue-iterator-context';
import Dialogue from '../src/lib/model/dialogues/dialogue';
import captureDialogue from './fixtures/dialogues/core/capture.dialogue.json';
import helloWorldDialogue from './fixtures/dialogues/core/hello-world.dialogue.json';

/**
 * Builds a GameController without running its constructor, which would pull in the sound
 * manager, the UI controller, the keyboard manager and the zustand stores. Only the state
 * captureFlags() touches is populated.
 */
function makeController(definition = captureDialogue) {
  const controller = Object.create(GameController.prototype);
  controller.flags = new FlagStore();
  // Strictness pinned rather than inherited from the build, so these
  // expectations don't depend on import.meta.env.DEV.
  controller.dialogueIteratorContext = new DialogueIteratorContext(
    controller.flags,
    { strict: true }
  );
  controller.story = definition === null ? undefined : Dialogue.fromJson(definition);
  controller.submitted = [];
  controller.submitCapturedFlags = (flags) => { controller.submitted.push(flags); };
  return controller;
}

describe('GameController flag capture', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not submit anything when the capture condition is false', () => {
    const controller = makeController();
    controller.flags.set('survey-age', 42);

    controller.captureFlags();

    expect(controller.submitted).to.deep.equal([]);
  });

  it('should submit the matching flags when the capture condition is true', () => {
    const controller = makeController();
    controller.flags.set('consent', 1);
    controller.flags.set('survey-age', 42);
    controller.flags.set('survey-name', 'Ada');
    controller.flags.set('ending', 'bad');
    controller.flags.set('q1', 0);
    controller.flags.set('q10', 5);
    controller.flags.set('other', 7);

    controller.captureFlags();

    expect(controller.submitted).to.have.lengthOf(1);
    expect(controller.submitted[0]).to.deep.equal({
      'survey-age': 42,
      'survey-name': 'Ada',
      ending: 'bad',
      q1: 0,
    });
  });

  it('should submit a snapshot that is unaffected by the flag store reset', () => {
    const controller = makeController();
    controller.flags.set('consent', 1);
    controller.flags.set('survey-age', 42);

    controller.captureFlags();
    controller.flags.set('survey-age', 99);
    controller.flags.clear();

    expect(controller.submitted[0]).to.deep.equal({ 'survey-age': 42 });
  });

  it('should not submit anything when the story declares no capture', () => {
    const controller = makeController(helloWorldDialogue);

    controller.captureFlags();

    expect(controller.submitted).to.deep.equal([]);
  });

  it('should not submit anything and not throw when there is no story', () => {
    const controller = makeController(null);

    expect(() => controller.captureFlags()).to.not.throw();
    expect(controller.submitted).to.deep.equal([]);
  });

  it('should not submit anything when no flag matches the patterns', () => {
    const controller = makeController();
    controller.story.root.capture.flags = ['nothing-*'];
    controller.flags.set('consent', 1);
    controller.flags.set('survey-age', 42);

    controller.captureFlags();

    expect(controller.submitted).to.deep.equal([]);
  });

  it('should capture unconditionally when the capture declares no condition', () => {
    const controller = makeController();
    delete controller.story.root.capture.cond;
    controller.flags.set('ending', 'good');

    controller.captureFlags();

    expect(controller.submitted).to.deep.equal([{ ending: 'good' }]);
  });

  it('should treat a blank capture condition as absent', () => {
    const controller = makeController();
    controller.story.root.capture.cond = '   ';
    controller.flags.set('ending', 'good');

    controller.captureFlags();

    expect(controller.submitted).to.deep.equal([{ ending: 'good' }]);
  });

  it('should not throw when the capture condition cannot be evaluated', () => {
    const controller = makeController();
    controller.story.root.capture.cond = 'consent = $';
    controller.flags.set('ending', 'good');

    expect(() => controller.captureFlags()).to.not.throw();
    expect(controller.submitted).to.deep.equal([]);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should not throw when the capture declaration is malformed', () => {
    const controller = makeController();
    controller.story.root.capture.cond = null;
    controller.story.root.capture.flags = 'not-an-array';

    expect(() => controller.captureFlags()).to.not.throw();
    expect(controller.submitted).to.deep.equal([]);
  });

  it('should run exactly once, before the restart clears the flags', () => {
    const controller = makeController();
    controller.flags.set('consent', 1);
    controller.flags.set('survey-age', 42);
    let startGameCalls = 0;
    controller.startGame = () => {
      startGameCalls += 1;
      controller.flags.clear();
    };

    // Mirrors the natural end: terminate() emits 'terminate' before 'end' reaches
    // handleGameEnded(), which restarts the game and clears the flags.
    controller.captureFlags();
    controller.handleGameEnded();

    expect(controller.submitted).to.have.lengthOf(1);
    expect(controller.submitted[0]).to.deep.equal({ 'survey-age': 42 });
    expect(startGameCalls).to.equal(1);
    expect(controller.gameInProgress).to.equal(false);
  });
});

describe('GameController.submitCapturedFlags', () => {
  /**
   * Builds a controller that keeps the real submitCapturedFlags(), wired to the given
   * Nachbarin handle.
   */
  function makeSubmittingController(nachbarin) {
    const controller = makeController();
    delete controller.submitCapturedFlags;
    controller.nachbarin = nachbarin;
    return controller;
  }

  beforeEach(() => {
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should write the captured flags to the Nachbarin client', () => {
    const client = { write: vi.fn(() => 'record-id') };
    const onResult = () => {};
    const controller = makeSubmittingController({ client, onResult });
    controller.flags.set('consent', 1);
    controller.flags.set('survey-age', 42);

    controller.captureFlags();

    expect(client.write).toHaveBeenCalledTimes(1);
    expect(client.write).toHaveBeenCalledWith(
      { appData: { flags: { 'survey-age': 42 } } },
      { onResult }
    );
  });

  it('should drop the flags without throwing when Nachbarin is not used', () => {
    const controller = makeSubmittingController(null);
    controller.flags.set('consent', 1);
    controller.flags.set('survey-age', 42);

    expect(() => controller.captureFlags()).to.not.throw();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log, not throw, when the client refuses the record', () => {
    const client = { write: vi.fn(() => { throw new Error('app_data too large'); }) };
    const controller = makeSubmittingController({ client, onResult: () => {} });
    controller.flags.set('consent', 1);
    controller.flags.set('survey-age', 42);

    expect(() => controller.captureFlags()).to.not.throw();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should never log flag values', () => {
    const client = { write: vi.fn(() => 'record-id') };
    const controller = makeSubmittingController({ client, onResult: () => {} });
    controller.flags.set('consent', 1);
    controller.flags.set('survey-name', 'Ada Lovelace');

    controller.captureFlags();

    const logged = [logger.debug, logger.info, logger.error]
      .flatMap((spy) => spy.mock.calls.flat())
      .map(String);
    expect(logged.some((arg) => arg.includes('Ada Lovelace'))).to.equal(false);
  });
});

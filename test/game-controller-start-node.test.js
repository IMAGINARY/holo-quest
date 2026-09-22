import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import logger from 'loglevel';
import GameController from '../src/lib/game/game-controller';
import Dialogue from '../src/lib/model/dialogues/dialogue';
import helloThenWorldDialogue from './fixtures/dialogues/core/then.dialogue.json';

/**
 * Builds a GameController without running its constructor, which would pull in the sound
 * manager, the UI controller, the keyboard manager and the zustand stores. Only the state
 * resolveStartNode() touches is populated.
 */
function makeController(config) {
  const controller = Object.create(GameController.prototype);
  controller.config = config;
  return controller;
}

describe('GameController start node', () => {
  const story = Dialogue.fromJson(helloThenWorldDialogue);

  beforeEach(() => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve a valid configured startNode', () => {
    const controller = makeController({ app: { startNode: 'world' } });

    expect(controller.resolveStartNode(story)).to.equal('world');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should fall back to the root node and warn on an unknown startNode', () => {
    const controller = makeController({ app: { startNode: 'nope' } });

    expect(controller.resolveStartNode(story)).to.equal(undefined);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should fall back to the root node without warning when startNode is unset', () => {
    const controller = makeController({ app: {} });

    expect(controller.resolveStartNode(story)).to.equal(undefined);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should fall back to the root node without warning when startNode is blank', () => {
    const controller = makeController({ app: { startNode: '' } });

    expect(controller.resolveStartNode(story)).to.equal(undefined);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

import DialogueIteratorContext from '../../src/lib/model/dialogues/dialogue-iterator-context';
import FlagStore from '../../src/lib/model/flag-store';

export default class TestDialogueIteratorContext extends DialogueIteratorContext {
  /**
   * @param {Object} [options] - Passed through to DialogueIteratorContext.
   *   Strictness is pinned to true by default so tests surface expression
   *   errors instead of depending on the build's DEV flag.
   */
  constructor(options = {}) {
    super(new FlagStore(), { strict: true, ...options });
    this.randomValues = [];
  }

  setRandom(random) {
    this.randomValues = random;
  }

  random() {
    if (this.randomValues.length === 0) {
      throw new Error('Not enough random values set');
    }
    return this.randomValues.shift();
  }
}

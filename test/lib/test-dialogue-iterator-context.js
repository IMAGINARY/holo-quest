import DialogueIteratorContext from '../../src/lib/model/dialogues/dialogue-iterator-context';
import FlagStore from '../../src/lib/model/flag-store';

export default class TestDialogueIteratorContext extends DialogueIteratorContext {
  constructor() {
    super(new FlagStore(), {
      'test-action': (options = {}) => {
        this.actionHandlerCalls.push(options);
      },
    });
    this.actionHandlerCalls = [];
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

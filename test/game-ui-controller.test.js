import {
  describe, it, expect, beforeEach,
} from 'vitest';
import GameUiController from '../src/lib/game/game-ui-controller';
import useGameState from '../src/lib/stores/game-state';

/** Spinner positions, ascending. Object key order puts negatives last. */
const positionsOf = (options) => Object.keys(options).map(Number).sort((a, b) => a - b);

describe('GameUiController', () => {
  let controller = null;

  beforeEach(() => {
    useGameState.getState().reset();
    controller = new GameUiController({}, null);
  });

  describe('showInput', () => {
    // Responses carrying non-numeric `value`s used to be keyed by that value,
    // which made `assertInputControl` throw and gave OptionRail NaN positions.
    const valuedResponses = [
      { id: 'pick-red', text: 'Red', value: 'red' },
      { id: 'pick-green', text: 'Green', value: 'green' },
      { id: 'pick-blue', text: 'Blue', value: 'blue' },
    ];

    it('should accept responses whose values are not numbers', () => {
      expect(() => controller.showInput(valuedResponses)).to.not.throw();
    });

    it('should key options by spinner position, not by response value', () => {
      controller.showInput(valuedResponses);
      const { options } = useGameState.getState().input;
      expect(positionsOf(options)).to.deep.equal([-1, 1, 2]);
      expect(Object.values(options)).to.have.members(['Red', 'Green', 'Blue']);
    });

    it('should produce only finite positions, as the spinner UI requires', () => {
      controller.showInput(valuedResponses);
      const { options } = useGameState.getState().input;
      expect(positionsOf(options).every(Number.isFinite)).to.be.true;
    });

    it('should position responses without values identically', () => {
      const plain = valuedResponses.map(({ id, text }) => ({ id, text }));
      controller.showInput(plain);
      expect(positionsOf(useGameState.getState().input.options)).to.deep.equal([-1, 1, 2]);
    });

    it('should skip the neutral position for an even number of responses', () => {
      controller.showInput(valuedResponses.slice(0, 2));
      expect(positionsOf(useGameState.getState().input.options)).to.deep.equal([-1, 1]);
    });
  });

  describe('handleInput', () => {
    it('should resolve a spinner position to the response id', () => {
      controller.showInput([
        { id: 'pick-red', text: 'Red', value: 'red' },
        { id: 'pick-green', text: 'Green', value: 'green' },
        { id: 'pick-blue', text: 'Blue', value: 'blue' },
      ]);

      const emitted = [];
      controller.events.on('input', (id) => emitted.push(id));

      controller.handleInput(-1);
      controller.handleInput(2);

      expect(emitted).to.deep.equal(['pick-red', 'pick-blue']);
    });

    it('should emit undefined for a position with no response', () => {
      controller.showInput([{ id: 'only', text: 'Only' }]);

      let emitted = 'unset';
      controller.events.on('input', (id) => { emitted = id; });
      controller.handleInput(99);

      expect(emitted).to.be.undefined;
    });
  });
});

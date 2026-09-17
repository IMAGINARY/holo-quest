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

    it('should key options by an authored position when responses carry one', () => {
      controller.showInput([
        { id: 'a', text: 'Left', position: -2 },
        { id: 'b', text: 'Middle', position: -1 },
        { id: 'c', text: 'Right', position: 1 },
      ]);
      const { options } = useGameState.getState().input;
      expect(positionsOf(options)).to.deep.equal([-2, -1, 1]);
      expect(options['-2']).to.equal('Left');
      expect(options['1']).to.equal('Right');
    });

    // Authored placement is asymmetric on purpose; auto-layout would have
    // spread these three over [-1, 1, 2].
    it('should not re-centre an authored set', () => {
      controller.showInput([
        { id: 'a', text: 'One', position: 1 },
        { id: 'b', text: 'Two', position: 2 },
        { id: 'c', text: 'Three', position: 3 },
      ]);
      expect(positionsOf(useGameState.getState().input.options)).to.deep.equal([1, 2, 3]);
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

    // Emitting for an empty position would reach `nextWithResponse` as
    // `undefined` and throw, ending the story mid-run.
    it('should emit nothing for a position with no response', () => {
      controller.showInput([{ id: 'only', text: 'Only' }]);

      let emitted = 'unset';
      controller.events.on('input', (id) => { emitted = id; });
      controller.handleInput(99);

      expect(emitted).to.equal('unset');
    });
  });
});

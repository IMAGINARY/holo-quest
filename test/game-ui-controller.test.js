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

  describe('showInput with a selected control', () => {
    const three = [
      { id: 'a', text: 'Reading' },
      { id: 'b', text: 'Sleeping' },
      { id: 'c', text: 'Going out' },
    ];
    // Controls declare how they want their responses placed.
    const uiControls = new Map([
      ['rail', { placement: 'centered' }],
      ['drum', { placement: 'sequential' }],
    ]);

    beforeEach(() => {
      controller = new GameUiController({}, null, uiControls);
    });

    it('should use the default control, without a placeholder, when none is given', () => {
      controller.showInput(three);
      const input = useGameState.getState().input;
      expect(input.type).to.equal('rail');
      expect(input).to.not.have.property('placeholder');
      expect(positionsOf(input.options)).to.deep.equal([-1, 1, 2]);
    });

    it('should record the selected control as the input type', () => {
      controller.showInput(three, { control: 'drum' });
      expect(useGameState.getState().input.type).to.equal('drum');
    });

    it('should number responses 1..n in order for a sequential control', () => {
      controller.showInput(three, { control: 'drum' });
      const { options } = useGameState.getState().input;
      expect(positionsOf(options)).to.deep.equal([1, 2, 3]);
      expect(options[1]).to.equal('Reading');
      expect(options[3]).to.equal('Going out');
    });

    // The drum's track has no negative side, so authored placement can't apply.
    it('should ignore authored positions for a sequential control', () => {
      controller.showInput([
        { id: 'a', text: 'Left', position: -1 },
        { id: 'b', text: 'Right', position: 1 },
      ], { control: 'drum' });
      expect(positionsOf(useGameState.getState().input.options)).to.deep.equal([1, 2]);
    });

    it('should still honour authored positions for a centered control', () => {
      controller.showInput([
        { id: 'a', text: 'Left', position: -1 },
        { id: 'b', text: 'Right', position: 1 },
      ], { control: 'rail' });
      expect(positionsOf(useGameState.getState().input.options)).to.deep.equal([-1, 1]);
    });

    it('should resolve a sequential position back to its response', () => {
      controller.showInput(three, { control: 'drum' });
      const emitted = [];
      controller.events.on('input', (id) => emitted.push(id));
      controller.handleInput(1);
      controller.handleInput(3);
      expect(emitted).to.deep.equal(['a', 'c']);
    });

    it('should pass a placeholder through to the input', () => {
      controller.showInput(three, { control: 'drum', placeholder: 'Select an activity' });
      expect(useGameState.getState().input.placeholder).to.equal('Select an activity');
    });

    it('should pass a translated placeholder through unchanged', () => {
      const placeholder = { en: 'Select an activity', de: 'Wähle eine Aktivität' };
      controller.showInput(three, { control: 'drum', placeholder });
      expect(useGameState.getState().input.placeholder).to.deep.equal(placeholder);
    });

    it('should lay out an unregistered control as centered rather than fail', () => {
      controller.showInput(three, { control: 'wheel' });
      expect(positionsOf(useGameState.getState().input.options)).to.deep.equal([-1, 1, 2]);
    });
  });

  describe('showContinueInput', () => {
    it('should use the default control', () => {
      controller = new GameUiController({ strings: { continue: 'Continue' } }, null);
      controller.showContinueInput();
      const { input } = useGameState.getState();
      expect(input.type).to.equal('rail');
      expect(input.options).to.deep.equal({ 1: 'Continue' });
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

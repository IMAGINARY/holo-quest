import EventEmitter from 'eventemitter3';
import useGameState from '../stores/game-state';

export default class GameUiController {
  constructor(config, gameController) {
    this.config = config;
    this.gameController = gameController;
    this.events = new EventEmitter();
  }

  // eslint-disable-next-line class-methods-use-this
  showText(text) {
    useGameState.getState().setText(text);
  }

  // eslint-disable-next-line class-methods-use-this
  hideText() {
    useGameState.getState().setText(null);
  }

  // eslint-disable-next-line class-methods-use-this
  showContinueInput() {
    useGameState.getState().setInput({
      type: 'default',
      options: {
        1: this.config.strings.continue,
      },
    });
  }

  showInput(responses) {
    const options = {};
    this.responsesByPosition = {};

    // Option keys are spinner POSITIONS, never narrative data. `OptionRail`
    // and `GameView` both read them back through `Number()` to lay out a
    // number line, and `handleInput()` receives the settled position.
    //
    // A response's `value` is narrative data destined for the node's
    // `responseFlag` and is routinely non-numeric ("red", "yes"), so using it
    // here produces NaN positions and trips `assertInputControl`.
    //
    // Placement comes from one of two sources. When responses carry an
    // authored `position`, it is used as the key directly; validation
    // guarantees the set is all-or-none, unique, non-zero and contiguous.
    // Otherwise the set is laid out symmetrically around the centre.
    // Position 0 is skipped either way: it is the neutral resting position,
    // and `useSpinnerController` never confirms there.
    const authored = responses.length > 0 && responses[0].position !== undefined;
    const negCount = Math.floor(responses.length / 2);
    const positionAt = (response, i) => {
      if (authored) return response.position;
      return i < negCount ? i - negCount : i - negCount + 1;
    };

    responses.forEach((response, i) => {
      const position = positionAt(response, i);
      options[position] = response.text;
      this.responsesByPosition[position] = response;
    });

    useGameState.getState().setInput({
      type: 'default',
      options,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  hideInput() {
    useGameState.getState().setInput(null);
  }

  // eslint-disable-next-line class-methods-use-this
  setBackgroundPath(path) {
    useGameState.getState().setBackgroundPath(path);
  }

  playSound(sound) {
    this.stopSound();
    const path = typeof sound === 'string' ? sound : sound?.path;
    const loop = typeof sound === 'object' && sound !== null ? Boolean(sound.loop) : false;
    if (path) {
      this.activeSoundHowl = this.gameController.soundManager.playByPath(path, { loop });
    }
  }

  stopSound() {
    if (this.activeSoundHowl) {
      this.activeSoundHowl.stop();
      this.activeSoundHowl.unload();
      this.activeSoundHowl = null;
    }
  }

  clearScreen() {
    this.hideText();
    this.hideInput();
    this.stopSound();
  }

  handleTextShown() {
    this.events.emit('textShown');
  }

  handleInput(position) {
    const response = this.responsesByPosition?.[position];
    // A settled position with no response behind it is ignored rather than
    // emitted: `DialogueIterator.nextWithResponse` throws on an unknown id,
    // which would end the story mid-run. Authored positions stay contiguous
    // by validation, but a set thinned by `cond` can still leave a gap.
    if (!response) return;
    this.events.emit('input', response.id);
  }
}

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
    // A response's `value` is narrative data destined for the node's
    // `responseFlag` and is routinely non-numeric ("red", "yes"), so using it
    // here produces NaN positions and trips `assertInputControl`.
    // Position 0 is skipped: it is the neutral resting position.
    const negCount = Math.floor(responses.length / 2);
    responses.forEach((response, i) => {
      const position = i < negCount ? i - negCount : i - negCount + 1;
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
    const responseId = this.responsesByPosition?.[position]?.id;
    this.events.emit('input', responseId);
  }
}

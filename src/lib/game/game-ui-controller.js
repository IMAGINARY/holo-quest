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
    this.responsesByValue = {};

    // Upstream validation guarantees that either every response has a `value`
    // or none do, and that any present `value`s are unique.
    const hasValues = responses.length > 0 && responses[0].value !== undefined;

    if (hasValues) {
      responses.forEach((response) => {
        options[response.value] = response.text;
        this.responsesByValue[response.value] = response;
      });
    } else {
      const negCount = Math.floor(responses.length / 2);
      responses.forEach((response, i) => {
        const value = i < negCount ? i - negCount : i - negCount + 1;
        options[value] = response.text;
        this.responsesByValue[value] = response;
      });
    }

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

  handleInput(value) {
    const responseId = this.responsesByValue?.[value]?.id;
    this.events.emit('input', responseId);
  }
}

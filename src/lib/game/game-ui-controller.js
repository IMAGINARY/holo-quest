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

  // eslint-disable-next-line class-methods-use-this
  showInput(options) {
    useGameState.getState().setInput({
      type: 'default',
      options,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  hideInput() {
    useGameState.getState().setInput(null);
  }

  clearScreen() {
    this.hideText();
    this.hideInput();
  }

  handleTextShown() {
    this.events.emit('textShown');
  }

  handleInput(value) {
    this.events.emit('input', value);
  }
}

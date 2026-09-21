import EventEmitter from 'eventemitter3';
import useGameState from '../stores/game-state';
import { DEFAULT_UI_CONTROL } from './ui-controls';

/**
 * @import { LangText } from '../model/type-guards'
 */

export default class GameUiController {
  /**
   * @param {object} config The application configuration object.
   * @param {GameController} gameController The owning game controller.
   * @param {Map<string, Function>} [uiControls] The registered input controls, by identifier.
   *  Consulted for each control's `placement`; an unregistered one is laid out as `'centered'`.
   */
  constructor(config, gameController, uiControls = new Map()) {
    this.config = config;
    this.gameController = gameController;
    this.uiControls = uiControls;
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
      type: DEFAULT_UI_CONTROL,
      options: {
        1: this.config.strings.continue,
      },
    });
  }

  /**
   * Offers the responses to the player through an input control.
   *
   * @param {object[]} responses The enabled responses of the active statement.
   * @param {object} [options]
   * @param {string} [options.control] Identifier of the registered input control to use (the
   *  statement's `responseControl`). Defaults to {@link DEFAULT_UI_CONTROL}.
   * @param {LangText} [options.placeholder] Label for controls that show one (the statement's
   *  `responsePlaceholder`).
   */
  showInput(responses, { control = DEFAULT_UI_CONTROL, placeholder } = {}) {
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
    // Placement is up to the control (its static `placement`). `'sequential'`
    // controls, like the drum, number the responses 1..n in order and ignore
    // any authored `position`. Everything else is `'centered'`: when responses
    // carry an authored `position`, it is used as the key directly; validation
    // guarantees the set is all-or-none, unique, non-zero and contiguous.
    // Otherwise the set is laid out symmetrically around the centre.
    // Position 0 is skipped either way: it is the neutral resting position,
    // and `useSpinnerController` never confirms there.
    const sequential = this.uiControls.get(control)?.placement === 'sequential';
    const authored = !sequential && responses.length > 0 && responses[0].position !== undefined;
    const negCount = Math.floor(responses.length / 2);
    const positionAt = (response, i) => {
      if (sequential) return i + 1;
      if (authored) return response.position;
      return i < negCount ? i - negCount : i - negCount + 1;
    };

    responses.forEach((response, i) => {
      const position = positionAt(response, i);
      options[position] = response.text;
      this.responsesByPosition[position] = response;
    });

    useGameState.getState().setInput({
      type: control,
      options,
      ...(placeholder !== undefined && { placeholder }),
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

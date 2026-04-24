import { logger } from '../helpers/logger';
import useGameState from '../stores/game-state';

export default class GameController {
  /**
   * Creates a new GameController instance.
   *
   * @param {object} config The application configuration object. Expected to contain
   *  `game.languages` (non-empty array of language codes) and optionally `shortcuts`
   *  (a map of command IDs to shortcut strings).
   */
  constructor(config) {
    this.config = config;
    this.languages = config.game.languages;
    this.commands = {
      toggleLang: () => this.toggleLang(),
      showRestartDialog: () => this.showRestartDialog(),
    };

    this.setLang(this.languages[0]);
    this.initKeyboardHandlers();
  }

  /**
   * Returns the currently active language code.
   *
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  getLang() {
    return useGameState.getState().lang;
  }

  /**
   * Sets the active language.
   *
   * @param {string} lang The language code to activate.
   */
  // eslint-disable-next-line class-methods-use-this
  setLang(lang) {
    useGameState.getState().setLang(lang);
  }

  /**
   * Stores the loaded story script on the controller for later use.
   *
   * @param {object} story The parsed story object.
   */
  setStory(story) {
    this.story = story;
  }

  /**
   * Shows the restart-game dialog by flipping `restartDialogVisible` in game state.
   */
  // eslint-disable-next-line class-methods-use-this
  showRestartDialog() {
    useGameState.getState().setRestartDialogVisible(true);
  }

  /**
   * Hides the restart-game dialog by flipping `restartDialogVisible` in game state.
   */
  // eslint-disable-next-line class-methods-use-this
  hideRestartDialog() {
    useGameState.getState().setRestartDialogVisible(false);
  }

  /**
   * Advances to the next language in `config.game.languages`, wrapping around at the end.
   * If the current language isn't in the list, falls back to the first entry.
   */
  toggleLang() {
    const current = this.getLang();
    const index = this.languages.indexOf(current);
    const next = this.languages[(index + 1) % this.languages.length];
    this.setLang(next);
  }

  /**
   * Reads `config.shortcuts` and wires a single `keydown` listener on `document` that
   * dispatches to the matching command. Shortcut strings follow the `[Modifier+]*KeyCode`
   * grammar documented in `config/shortcuts.yml`.
   */
  initKeyboardHandlers() {
    const shortcuts = this.config.shortcuts ?? {};
    const bindings = [];

    Object.entries(shortcuts).forEach(([commandId, shortcutString]) => {
      const command = this.commands[commandId];
      if (!command) {
        logger.warn(`GameController: shortcut '${shortcutString}' references unknown command '${commandId}'`);
        return;
      }
      bindings.push({
        descriptor: GameController.parseShortcut(shortcutString),
        callback: command,
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      bindings.forEach(({ descriptor, callback }) => {
        if (GameController.matchesShortcut(event, descriptor)) {
          callback();
        }
      });
    });
  }

  /**
   * Parses a shortcut string into a descriptor object.
   *
   * @param {string} shortcutString E.g. `"KeyR"`, `"Alt+KeyJ"`, `"Ctrl+Shift+KeyP"`.
   * @returns {{ code: string, ctrl: boolean, alt: boolean, shift: boolean }}
   */
  static parseShortcut(shortcutString) {
    const parts = shortcutString.split('+').map((p) => p.trim());
    const code = parts.pop();
    const modifiers = parts.map((m) => m.toLowerCase());
    return {
      code,
      ctrl: modifiers.includes('ctrl'),
      alt: modifiers.includes('alt'),
      shift: modifiers.includes('shift'),
    };
  }

  /**
   * Tests whether a keyboard event matches a parsed shortcut descriptor.
   *
   * @param {KeyboardEvent} event
   * @param {{ code: string, ctrl: boolean, alt: boolean, shift: boolean }} descriptor
   * @returns {boolean}
   */
  static matchesShortcut(event, descriptor) {
    return event.code === descriptor.code
      && event.ctrlKey === descriptor.ctrl
      && event.altKey === descriptor.alt
      && event.shiftKey === descriptor.shift;
  }
}

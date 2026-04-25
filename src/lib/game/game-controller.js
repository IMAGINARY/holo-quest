import { logger } from '../helpers/logger';
import useGameState from '../stores/game-state';
import KeyboardInputMgr from '../input/keyboard-input-mgr';

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
    this.gameInProgress = false;
    this.commands = {
      toggleLang: () => this.toggleLang(),
      showRestartDialog: () => this.showRestartDialog(),
    };

    this.setLang(this.languages[0]);
    this.keyboardInputMgr = new KeyboardInputMgr();
    this.initKeyboardHandlers();
  }

  startGame() {
    if (this.gameInProgress) {
      this.endGame();
    }
    this.gameInProgress = true;
  }

  endGame() {
    this.gameInProgress = false;
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
   * Reads `config.shortcuts` and registers each shortcut with the keyboard input manager.
   * Shortcut strings follow the `[Modifier+]*KeyCode` grammar documented in `config/shortcuts.yml`.
   */
  initKeyboardHandlers() {
    const shortcuts = this.config.shortcuts ?? {};
    Object.entries(shortcuts).forEach(([commandId, shortcutString]) => {
      const command = this.commands[commandId];
      if (!command) {
        logger.warn(`GameController: shortcut '${shortcutString}' references unknown command '${commandId}'`);
        return;
      }
      this.keyboardInputMgr.addShortcut(shortcutString, command);
    });
  }
}

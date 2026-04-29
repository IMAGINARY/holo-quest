import { logger } from '../helpers/logger';
import useGameState from '../stores/game-state';
import KeyboardInputMgr from '../input/keyboard-input-mgr';
import FlagStore from '../model/flag-store';
import DialogueEffectFactory from '../model/dialogues/effects/dialogue-effect-factory';
import DialogueSequencer from '../model/dialogues/dialogue-sequencer';
import DialogueIteratorContext from '../model/dialogues/dialogue-iterator-context';
import GameUiController from './game-ui-controller';

export default class GameController {
  /**
   * Creates a new GameController instance.
   *
   * @param {object} config The application configuration object. Expected to contain
   *  `game.languages` (non-empty array of language codes), optionally `game.defaultLanguage`
   *  (a language code from that list, used as the initial active language; falls back to the
   *  first list entry when absent or unknown), and optionally `shortcuts` (a map of command
   *  IDs to shortcut strings).
   */
  constructor(config) {
    this.config = config;
    this.languages = config.game.languages;
    this.initLang();
    this.gameInProgress = false;
    this.flags = new FlagStore();

    this.dialogueEffectFactory = new DialogueEffectFactory(this);
    this.gameUiController = new GameUiController(this.config, this);
    this.dialogueSequencer = new DialogueSequencer(
      this.dialogueEffectFactory,
      this.gameUiController
    );
    this.dialogueSequencer.events.on('terminate', this.handleGameEnded.bind(this));
    this.dialogueIteratorContext = new DialogueIteratorContext(this.flags);

    // noinspection JSUnusedGlobalSymbols
    this.commands = {
      toggleLang: () => this.toggleLang(),
      showRestartDialog: () => this.showRestartDialog(),
      previewNextStatement: () => this.dialogueSequencer.previewNextStatement(),
      previewPrevStatement: () => this.dialogueSequencer.previewPrevStatement(),
    };
    this.keyboardInputMgr = new KeyboardInputMgr();
    this.initKeyboardHandlers();
  }

  /**
   * Picks the initial active language from `config.game.defaultLanguage` if set
   * and present in `this.languages`; otherwise falls back to the first entry of
   * `this.languages`. Logs a warning when `defaultLanguage` is set but unknown.
   */
  initLang() {
    const { defaultLanguage } = this.config.game;
    let initialLang = this.languages[0];
    if (defaultLanguage) {
      if (this.languages.includes(defaultLanguage)) {
        initialLang = defaultLanguage;
      } else {
        logger.warn(
          "GameController: configured defaultLanguage '%s' is not in languages list; falling back to '%s'",
          defaultLanguage,
          initialLang
        );
      }
    }
    this.setLang(initialLang);
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
   * Stores the loaded story script on the controller for later use.
   *
   * @param {Dialogue} story The parsed story object.
   */
  setStory(story) {
    this.story = story;
  }

  startGame() {
    if (this.gameInProgress) {
      this.endGame();
    }
    this.resetState();
    this.gameInProgress = true;

    this.dialogueSequencer.play(this.story, this.dialogueIteratorContext);
  }

  /**
   * Resets all transient per-game state (zustand game-state store and flag
   * store). Called when a new game starts.
   */
  resetState() {
    useGameState.getState().reset();
    this.flags.clear();
    this.dialogueIteratorContext.clearState();
  }

  endGame() {
    this.dialogueSequencer.terminate();
  }

  handleGameEnded() {
    this.gameInProgress = false;
    this.startGame();
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
}

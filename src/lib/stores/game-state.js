import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  assertString, assertStringOrNull, assertLangText, assertInputControl,
} from '../model/type-guards';

/**
 * @import { LangText } from '../model/type-guards'
 * @import { InputControl } from '../model/type-guards'
 */

/**
 * @typedef {Object} GameState
 * @property {LangText|null} text - Dialogue text currently displayed to the
 *   player.
 * @property {InputControl|null} input - Player input control (type + options).
 * @property {(text: LangText|null) => void} setText - Replace the current
 *   dialogue text.
 * @property {(input: InputControl|null) => void} setInput - Replace the current
 *   input control.
 * @property {string|null} backgroundPath - Path to the background image shown
 *   on the back screen, or null when no background is set.
 * @property {(path: string|null) => void} setBackgroundPath - Replace the
 *   current background image path.
 * @property {string} lang - Active language code (e.g. 'en', 'de').
 * @property {(lang: string) => void} setLang - Change the active language.
 * @property {boolean} restartDialogVisible - Whether the restart-game dialog
 *   is currently shown.
 * @property {(visible: boolean) => void} setRestartDialogVisible - Show or
 *   hide the restart-game dialog.
 * @property {() => void} reset - Reset transient game state (text, input,
 *   restartDialogVisible) to initial values. `lang` is preserved as a user
 *   preference.
 */

const initialTransientState = {
  text: null,
  input: null,
  backgroundPath: null,
  restartDialogVisible: false,
};

const useGameState = create(
  immer((set) => ({
    ...initialTransientState,
    lang: 'en',

    /**
     * Replace the current dialogue text.
     *
     * @param {LangText|null} text - Text to display, or null to clear.
     * @throws {TypeError} If text is not a valid lang-text value.
     */
    setText: (text) => {
      assertLangText(text, 'setText');
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.text = text; });
    },

    /**
     * Replace the current input control.
     *
     * @param {InputControl|null} input - Input control, or null to clear.
     * @throws {TypeError} If input is not a valid control object or null.
     */
    setInput: (input) => {
      assertInputControl(input, 'setInput');
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.input = input; });
    },

    /**
     * Replace the current background image path.
     *
     * @param {string|null} path - Image path, or null to clear.
     * @throws {TypeError} If path is not a string or null.
     */
    setBackgroundPath: (path) => {
      assertStringOrNull(path, 'setBackgroundPath');
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.backgroundPath = path; });
    },

    /**
     * Change the active language.
     *
     * @param {string} lang - Language code (e.g. 'en', 'de').
     * @throws {TypeError} If lang is not a string.
     */
    setLang: (lang) => {
      assertString(lang, 'setLang');
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.lang = lang; });
    },

    /**
     * Show or hide the restart-game dialog.
     *
     * @param {boolean} visible - True to show, false to hide.
     */
    setRestartDialogVisible: (visible) => {
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.restartDialogVisible = visible; });
    },

    /**
     * Reset transient game state to initial values. `lang` is preserved as a
     * user preference. Called by GameController when a new game starts.
     */
    reset: () => {
      set((state) => {
        Object.assign(state, initialTransientState);
      });
    },
  }))
);

export default useGameState;

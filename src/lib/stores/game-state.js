import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { assertString, assertLangText, assertInputOptions } from '../model/type-guards';

/**
 * @import { LangText } from '../model/type-guards'
 * @import { InputOptions } from '../model/type-guards'
 */

/**
 * @typedef {Object} GameState
 * @property {LangText|null} text - Dialogue text currently displayed to the
 *   player.
 * @property {InputOptions|null} input - Player choice options.
 * @property {(text: LangText|null) => void} setText - Replace the current
 *   dialogue text.
 * @property {(input: InputOptions|null) => void} setInput - Replace the current
 *   player choice options.
 * @property {string} lang - Active language code (e.g. 'en', 'de').
 * @property {(lang: string) => void} setLang - Change the active language.
 */

const useGameState = create(
  immer((set) => ({
    text: null,
    input: null,
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
     * Replace the current player choice options.
     *
     * @param {InputOptions|null} input - Choice options, or null to clear.
     * @throws {TypeError} If input is not a valid options object or null.
     */
    setInput: (input) => {
      assertInputOptions(input, 'setInput');
      // eslint-disable-next-line no-param-reassign
      set((state) => { state.input = input; });
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
  }))
);

export default useGameState;
